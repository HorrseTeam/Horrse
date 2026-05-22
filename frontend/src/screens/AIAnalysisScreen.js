import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import API_URL from '../config/api';

export default function AIAnalysisScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisType, setAnalysisType] = useState('hoof'); // 'hoof' 또는 'lameness'
  const [walkDirection, setWalkDirection] = useState('SIDE');
  const [walkType, setWalkType] = useState('WALK');

  // 화면이 언마운트 되었는지 감지하기 위한 Ref (메모리 누수 방지용)
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false; // 화면을 벗어나면 폴링 중단 지표가 됨
    };
  }, []);

  // 탭이 바뀔 때 기존에 업로드된 사진/영상 및 결과 초기화
  const handleTabChange = (type) => {
    setAnalysisType(type);
    setImage(null);
    setResult(null);
  };

  const pickImage = async () => {
    // 분석 타입에 따라 사진만 받을지, 비디오도 받을지 선택
    const mediaType = analysisType === 'hoof' 
      ? ImagePicker.MediaTypeOptions.Images 
      : ImagePicker.MediaTypeOptions.All; // 파행은 영상 분석이므로 All 또는 Videos

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const pollTaskStatus = async (taskId) => {
    // 화면을 벗어났다면 더 이상 요청하지 않음
    if (!isMounted.current) return;

    try {
      const res = await axios.get(`${API_URL}/ai/status/${taskId}`);
      const data = res.data;

      if (!isMounted.current) return;

      if (data.status === 'SUCCESS') {
        const finalResult = data.result?.result || data.result;
        setResult(finalResult);
        setLoading(false);
      } else if (data.status === 'FAILURE') {
        setLoading(false);
        Alert.alert('에러', 'AI 분석 중 실패했습니다.');
      } else {
        // PENDING 또는 PROCESSING 상태일 때 2초 후 다시 폴링
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
      Alert.alert('파일 필요', analysisType === 'hoof' ? '발굽 사진을 먼저 선택해주세요.' : '보행 영상을 먼저 선택해주세요.');
      return;
    }
    
    if (analysisType === 'lameness' && (!walkDirection || !walkType)) {
      Alert.alert('입력 요망', '보행 방향 및 형식을 선택해주세요.');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('horse_id', '1');
      
      if (analysisType === 'lameness') {
        formData.append('walk_direction', walkDirection);
        formData.append('walk_type', walkType);
      }
      
      // 파일명 및 타입 추출
      const filename = image.split('/').pop() || 'file.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // React Native 전용 FormData 파일 포맷팅 (객체 매핑 우회)
      const fileData = JSON.parse(JSON.stringify({
        uri: image,
        name: filename,
        type: type,
      }));
      formData.append('file', fileData);

      const endpoint = analysisType === 'hoof' ? '/ai/hoof' : '/ai/lameness';
      const response = await axios.post(API_URL + endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.task_id) {
        pollTaskStatus(response.data.task_id);
      } else {
        setLoading(false);
        Alert.alert('에러', 'Task ID를 받지 못했습니다.');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('에러', '서버 통신 중 문제가 발생했습니다.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI 진단 (Celery Queued)</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, analysisType === 'hoof' && styles.activeTab]}
          onPress={() => handleTabChange('hoof')}
        >
          <Text style={[styles.tabText, analysisType === 'hoof' && styles.activeTabText]}>발굽 분석</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, analysisType === 'lameness' && styles.activeTab]}
          onPress={() => handleTabChange('lameness')}
        >
          <Text style={[styles.tabText, analysisType === 'lameness' && styles.activeTabText]}>파행 영상 진단</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.uploadCard}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              {analysisType === 'hoof' ? '발굽 사진을 업로드하세요' : '보행 영상을 캡처/업로드하세요'}
            </Text>
          </View>
        )}

        {analysisType === 'lameness' && (
          <View style={{ marginBottom: 16 }}>
             <Text style={styles.inputLabel}>보행 방향</Text>
             <View style={styles.buttonSegment}>
                {['FRONT', 'SIDE', 'BACK'].map(dir => (
                   <TouchableOpacity key={dir} style={[styles.segmentBtn, walkDirection === dir && styles.segmentBtnActive]} onPress={() => setWalkDirection(dir)}>
                       <Text style={[styles.segmentText, walkDirection === dir && styles.segmentTextActive]}>{dir}</Text>
                   </TouchableOpacity>
                ))}
             </View>
             
             <Text style={styles.inputLabel}>보행 유형</Text>
             <View style={styles.buttonSegment}>
                {['WALK', 'TROT'].map(type => (
                   <TouchableOpacity key={type} style={[styles.segmentBtn, walkType === type && styles.segmentBtnActive]} onPress={() => setWalkType(type)}>
                       <Text style={[styles.segmentText, walkType === type && styles.segmentTextActive]}>{type}</Text>
                   </TouchableOpacity>
                ))}
             </View>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.outlineButton} onPress={pickImage}>
            <Text style={styles.outlineButtonText}>파일 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.solidButton} onPress={uploadAndAnalyze}>
            <Text style={styles.solidButtonText}>비동기 분석 요청</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>AI 큐에 대기중이거나 연산 중입니다...</Text>
        </View>
      )}

      {result && !loading && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>분석 결과</Text>
          <Text style={styles.resultMessage}>{result.message || '분석이 완료되었습니다.'}</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>진단 결과:</Text>
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
             <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                <Text style={styles.detailText}>
                  <Text style={{ fontWeight: 'bold' }}>이상 부위: </Text>
                  <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{result.diagnosis.affected_area}</Text>
                </Text>
                <Text style={styles.detailText}><Text style={{ fontWeight: 'bold' }}>문제 관절: </Text>{result.diagnosis.problem_joint}</Text>
                <Text style={styles.detailText}><Text style={{ fontWeight: 'bold' }}>상세 설명: </Text>{result.diagnosis.description}</Text>
                
                {result.joint_array && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#475569', marginBottom: 4 }}>
                      관절 좌표 데이터 ({result.joint_array.length}개 추출됨):
                    </Text>
                    {result.joint_array.slice(0, 3).map((j, i) => (
                       <Text key={i} style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                         • {j.name}: ({j.x}, {j.y}, score: {j.score})
                       </Text>
                    ))}
                    {result.joint_array.length > 3 && (
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>
                        ...외 {result.joint_array.length - 3}개 더보기
                      </Text>
                    )}
                  </View>
                )}
             </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  tabContainer: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#e2e8f0', borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { color: '#64748b', fontWeight: '600' },
  activeTabText: { color: '#0f172a' },
  uploadCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  placeholderBox: { height: 200, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  placeholderText: { color: '#94a3b8' },
  previewImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 16, resizeMode: 'cover' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  outlineButton: { flex: 1, borderWidth: 1, borderColor: '#3b82f6', borderRadius: 8, padding: 12, alignItems: 'center', marginRight: 8 },
  outlineButtonText: { color: '#3b82f6', fontWeight: 'bold' },
  solidButton: { flex: 1, backgroundColor: '#3b82f6', borderRadius: 8, padding: 12, alignItems: 'center', marginLeft: 8 },
  solidButtonText: { color: '#fff', fontWeight: 'bold' },
  loadingContainer: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  resultCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#10b981', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, marginBottom: 30 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  resultMessage: { color: '#475569', marginBottom: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 4 },
  resultLabel: { color: '#64748b' },
  resultValue: { fontWeight: 'bold', color: '#0f172a', fontSize: 18 }, // 오타 고침 (fontsize -> fontSize)
  inputLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#333' },
  buttonSegment: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 4 },
  segmentBtnActive: { backgroundColor: '#3b82f6' },
  segmentText: { color: '#64748b', fontWeight: 'bold' },
  segmentTextActive: { color: '#fff' },
  detailText: { fontSize: 14, color: '#334155', marginBottom: 4 }
});