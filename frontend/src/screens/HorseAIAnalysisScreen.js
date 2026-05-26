import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import API_URL from '../config/api';

export default function HorseAIAnalysisScreen({ route }) {
  const { horse, analysisType: initialType } = route.params;

  const [image, setImage] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisType, setAnalysisType] = useState(initialType || 'hoof');
  const [walkDirection, setWalkDirection] = useState('SIDE');
  const [walkType, setWalkType] = useState('WALK');

  // 🎯 메모리 누수 방지용 컴포넌트 활성화 플래그 Ref
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false; // 화면 이탈 시 비동기 상태 업데이트 차단
    };
  }, []);

  const pickImage = async () => {
    const mediaType = analysisType === 'hoof' 
      ? ImagePicker.MediaTypeOptions.Images 
      : ImagePicker.MediaTypeOptions.Videos;

    let res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType,
      allowsEditing: true,
      quality: 1,
    });

    if (!res.canceled) {
      const selectedFile = res.assets[0];
      const fileSize = selectedFile.fileSize || 0; 

      // 설계서 규격 용량 검증
      const limit = analysisType === 'hoof' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
      if (fileSize > limit) {
        Alert.alert('업로드 실패', '파일 유형 및 용량을 확인해주세요.');
        return;
      }

      // 확장자 포맷 검증
      const uri = selectedFile.uri.toLowerCase();
      const isImage = /\.(jpg|jpeg|png)$/.test(uri);
      const isVideo = /\.(mp4|mov)$/.test(uri);

      if (analysisType === 'hoof' && !isImage) {
        Alert.alert('업로드 실패', '파일 유형 및 용량을 확인해주세요.');
        return;
      }
      
      if (analysisType === 'lameness' && !isVideo) {
        Alert.alert('업로드 실패', '파일 유형 및 용량을 확인해주세요.');
        return;
      }

      setImage(selectedFile.uri);
      setResult(null);
    }
  };

  const pollTaskStatus = async (taskId) => {
    if (!isMounted.current) return;

    try {
      const res = await axios.get(`${API_URL}/ai/status/${taskId}`);
      const data = res.data;

      if (!isMounted.current) return;

      if (data.status === 'SUCCESS') {
        setResult(data.result?.result || data.result);
        setLoading(false);
      } else if (data.status === 'FAILURE') {
        setLoading(false);
        Alert.alert('에러', 'AI 분석 중 실패했습니다.');
      } else {
        // 아직 큐 대기중이거나 연산 중이면 2초 후 재귀 루프
        setTimeout(() => pollTaskStatus(taskId), 2000);
      }
    } catch (e) {
      if (isMounted.current) {
        setLoading(false);
        Alert.alert('에러', '상태 폴링 중 에러가 발생했습니다.');
      }
    }
  };

  const uploadAndAnalyze = async () => {
    if (!image) {
      Alert.alert('파일 필요', '분석할 파일을 먼저 선택해주세요.');
      return;
    }

    if (analysisType === 'lameness' && !walkDirection) {
      Alert.alert('입력 요망', '보행 방향을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('horse_id', String(horse.id));
      
      if (analysisType === 'lameness') {
        formData.append('walk_direction', walkDirection);
        formData.append('walk_type', walkType);
      }

      const filename = image.split('/').pop() || 'file.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `${analysisType === 'hoof' ? 'image' : 'video'}/${match[1]}` : `application/octet-stream`;
      
      // 🎯 [수정] 네이티브 멀티파트 충돌을 우회하는 데이터 매핑 규격화 적용
      const filePayload = JSON.parse(JSON.stringify({
        uri: image,
        name: filename,
        type: type
      }));
      formData.append(analysisType === 'hoof' ? 'image' : 'video', filePayload);

      const endpoint = analysisType === 'hoof' ? '/ai/hoof' : '/ai/lameness';
      const response = await axios.post(API_URL + endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.status === 'SUCCESS') {
        setResult(response.data.result);
        setLoading(false);
      } else {
        setLoading(false);
        Alert.alert('에러', response.data?.error?.message || 'AI 분석 중 오류가 발생했습니다.');
      }
    } catch (error) {
      setLoading(false);
      console.error("AI 요청 실패:", error);
      Alert.alert('에러', '서버 통신 중 문제가 발생했습니다.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.horseBanner}>
        <Text style={styles.horseBannerIcon}>🐴</Text>
        <View>
          <Text style={styles.horseBannerName}>{horse.name}</Text>
          <Text style={styles.horseBannerBreed}>{horse.breed}</Text>
        </View>
      </View>

      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>
          {analysisType === 'hoof' ? '🐾 발굽 분석' : '🦿 파행 진단'}
        </Text>
      </View>

      <View style={styles.uploadCard}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
          {image ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <View style={styles.rePickBadge}><Text style={styles.rePickText}>교체</Text></View>
            </View>
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderIcon}>
                {analysisType === 'hoof' ? '🐾' : '🎬'}
              </Text>
              <Text style={styles.placeholderText}>
                {analysisType === 'hoof' ? '발굽 사진을 업로드하세요 (최대 10MB)' : '보행 영상을 업로드하세요 (최대 100MB)'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {analysisType === 'lameness' && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>보행 방향</Text>
            <View style={styles.buttonSegment}>
              {['FRONT', 'SIDE', 'BACK'].map(dir => (
                <TouchableOpacity
                  key={dir}
                  style={[styles.segmentBtn, walkDirection === dir && styles.segmentBtnActive]}
                  onPress={() => setWalkDirection(dir)}
                >
                  <Text style={[styles.segmentText, walkDirection === dir && styles.segmentTextActive]}>{dir}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>보행 유형</Text>
            <View style={styles.buttonSegment}>
              {['WALK', 'TROT'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.segmentBtn, walkType === t && styles.segmentBtnActive]}
                  onPress={() => setWalkType(t)}
                >
                  <Text style={[styles.segmentText, walkType === t && styles.segmentTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.outlineButton} onPress={pickImage}>
            <Text style={styles.outlineButtonText}>📁 파일 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.solidButton, analysisType === 'hoof' ? { backgroundColor: '#10b981' } : { backgroundColor: '#4f6ef7' }]} 
            onPress={uploadAndAnalyze}
          >
            <Text style={styles.solidButtonText}>AI 분석 요청</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f6ef7" />
          <Text style={styles.loadingText}>AI 분석 중입니다...</Text>
        </View>
      )}

      {result && !loading && (
        <View style={[styles.resultCard, { borderLeftColor: analysisType === 'hoof' ? '#10b981' : '#4f6ef7' }]}>
          <Text style={styles.resultTitle}>분석 결과</Text>
          {result.message && <Text style={styles.resultMessage}>{result.message}</Text>}
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>진단:</Text>
            <Text style={styles.resultValue}>
              {analysisType === 'hoof' ? `${result.grade} 등급` : (result.lameness || result.lameness_yn)}
            </Text>
          </View>
          {analysisType === 'hoof' && result.confidence && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>신뢰도:</Text>
              <Text style={styles.resultValue}>{result.confidence}%</Text>
            </View>
          )}
          {analysisType === 'lameness' && result.diagnosis && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <Text style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 4 }}>
                이상 부위: <Text style={{ color: '#ef4444' }}>{result.diagnosis.affected_area}</Text>
              </Text>
              <Text style={{ color: '#475569', marginBottom: 2 }}>문제 관절: {result.diagnosis.problem_joint}</Text>
              <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 18 }}>상세설명: {result.diagnosis.description}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff', padding: 16 },
  horseBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 16, elevation: 2, gap: 12 },
  horseBannerIcon: { fontSize: 32 },
  horseBannerName: { fontSize: 17, fontWeight: '700', color: '#1e2d6b' },
  horseBannerBreed: { fontSize: 13, color: '#6b7cbe' },
  typeBadge: { alignSelf: 'flex-start', marginBottom: 14, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#e8eeff' },
  typeBadgeText: { fontSize: 14, fontWeight: '700', color: '#4f6ef7' },
  uploadCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 2 },
  placeholderBox: { height: 180, backgroundColor: '#f8faff', borderRadius: 10, borderWidth: 2, borderColor: '#c7d2fe', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  placeholderIcon: { fontSize: 40, marginBottom: 8 },
  placeholderText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', paddingHorizontal: 10 },
  previewContainer: { position: 'relative', width: '100%', height: 180, marginBottom: 16 },
  previewImage: { width: '100%', height: '100%', borderRadius: 10, resizeMode: 'cover' },
  rePickBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  rePickText: { color: '#fff', fontSize: 10 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#333' },
  buttonSegment: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentBtnActive: { backgroundColor: '#4f6ef7' },
  segmentText: { color: '#64748b', fontWeight: 'bold' },
  segmentTextActive: { color: '#fff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  outlineButton: { flex: 1, borderWidth: 1.5, borderColor: '#4f6ef7', borderRadius: 10, padding: 13, alignItems: 'center' },
  outlineButtonText: { color: '#4f6ef7', fontWeight: 'bold' },
  solidButton: { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center' },
  solidButtonText: { color: '#fff', fontWeight: 'bold' },
  loadingContainer: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#4f6ef7', fontWeight: '600' },
  resultCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderLeftWidth: 4, elevation: 1, marginBottom: 24 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  resultMessage: { color: '#475569', marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 },
  resultLabel: { color: '#64748b' },
  resultValue: { fontWeight: 'bold', color: '#0f172a' },
});