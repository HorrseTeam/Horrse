import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import API_URL from '../config/api';

export default function AIAnalysisScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisType, setAnalysisType] = useState('hoof');
  const [walkDirection, setWalkDirection] = useState('SIDE');
  const [walkType, setWalkType] = useState('WALK');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Items,
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
    try {
      const res = await axios.get(`${API_URL}/ai/status/${taskId}`);
      const data = res.data;
      if (data.status === 'SUCCESS') {
        const finalResult = data.result.result;
        setResult(finalResult);
        setLoading(false);
      } else if (data.status === 'FAILURE') {
        setLoading(false);
        Alert.alert('에러', 'AI 분석 중 실패했습니다.');
      } else {
        // Pending or processing, poll again
        setTimeout(() => pollTaskStatus(taskId), 2000);
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('에러', '상태 폴링 중 에러가 발생했습니다.');
    }
  };

  const uploadAndAnalyze = async () => {
    if (!image) {
      Alert.alert('사진 필요', '분석할 파일을 먼저 선택해주세요.');
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
      
      // Append a dummy file since we are using Expo mock image picker for web testing as well
      // In a real device environment, you would append the uri, name, and type properly.
      const filename = image.split('/').pop() || 'test.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('file', { uri: image, name: filename, type });

      const endpoint = analysisType === 'hoof' ? '/ai/hoof' : '/ai/lameness';
      const response = await axios.post(API_URL + endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.task_id) {
        // Start polling Celery queue status via Spring Boot proxy
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
          onPress={() => setAnalysisType('hoof')}
        >
          <Text style={[styles.tabText, analysisType === 'hoof' && styles.activeTabText]}>발굽 분석</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, analysisType === 'lameness' && styles.activeTab]}
          onPress={() => setAnalysisType('lameness')}
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
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.loadingText}>AI 큐에 대기중이거나 연산 중입니다...</Text>
        </View>
      )}

      {result && !loading && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>분석 결과</Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>진단:</Text>
            <Text style={styles.resultValue}>{analysisType === 'hoof' ? result.grade : (result.lameness || result.lameness_yn)}</Text>
          </View>
          {analysisType === 'hoof' && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>신뢰도:</Text>
              <Text style={styles.resultValue}>{result.confidence}%</Text>
            </View>
          )}
          
          {analysisType === 'lameness' && result.diagnosis && (
             <View style={{marginTop: 10}}>
                <Text style={{fontWeight: 'bold'}}>이상 부위: <Text style={{color: 'red'}}>{result.diagnosis.affected_area}</Text></Text>
                <Text>문제 관절: {result.diagnosis.problem_joint}</Text>
                <Text>상세설명: {result.diagnosis.description}</Text>
                
                <Text style={{fontWeight: 'bold', marginTop: 10}}>관절 좌표 데이터 ({result.joint_array ? result.joint_array.length : 0}개):</Text>
                {result.joint_array && result.joint_array.slice(0, 3).map((j, i) => (
                   <Text key={i} style={{fontSize: 11, color: '#555'}}>- {j.name}: ({j.x}, {j.y}, score:{j.score})</Text>
                ))}
                <Text style={{fontSize: 11, color: '#888'}}>... + {result.joint_array && result.joint_array.length - 3} more</Text>
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
  resultCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#10b981', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  resultMessage: { color: '#475569', marginBottom: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 4 },
  resultLabel: { color: '#64748b' },
  resultValue: { fontWeight: 'bold', color: '#0f172a', fontsize:18 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#333' },
  buttonSegment: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 4 },
  segmentBtnActive: { backgroundColor: '#3b82f6' },
  segmentText: { color: '#64748b', fontWeight: 'bold' },
  segmentTextActive: { color: '#fff' }
});
