import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import TrainingRecordModal from './TrainingRecordModal'; // 방금 만든 파일 불러오기

export default function HorseDetailScreen({ route, navigation }) {
  const { horse } = route.params;
  const [isModalVisible, setModalVisible] = useState(false); // 모달 열림 상태

  const getBreedIcon = (breed) => {
    if (!breed) return '🐴';
    if (breed.includes('더러브렛') || breed.includes('Thoroughbred')) return '🏇';
    if (breed.includes('제주')) return '🐎';
    return '🐴';
  };

  const getAge = (birthDate) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const now = new Date();
    return now.getFullYear() - birth.getFullYear() + 1 + '살';
  };

  return (
    <ScrollView style={styles.container}>
      {/* 1. 말 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{getBreedIcon(horse.breed)}</Text>
        </View>
        <Text style={styles.horseName}>{horse.name}</Text>
        <Text style={styles.horseBreed}>{horse.breed}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoBadge}><Text style={styles.infoBadgeLabel}>나이</Text><Text style={styles.infoBadgeValue}>{getAge(horse.birthDate)}</Text></View>
          <View style={styles.infoBadge}><Text style={styles.infoBadgeLabel}>생년월일</Text><Text style={styles.infoBadgeValue}>{horse.birthDate || '-'}</Text></View>
          <View style={styles.infoBadge}><Text style={styles.infoBadgeLabel}>ID</Text><Text style={styles.infoBadgeValue}>#{horse.registrationNumber}</Text></View>
        </View>
      </View>

      {/* 2. 훈련·컨디션 기록 버튼 섹션 */}
      <Text style={styles.sectionTitle}>훈련 및 컨디션 관리</Text>
      <TouchableOpacity 
        style={styles.recordButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.recordButtonText}>📝 훈련·컨디션 기록하기</Text>
      </TouchableOpacity>

      {/* 훈련 기록 전용 모달 컴포넌트 연결 */}
      <TrainingRecordModal 
        isVisible={isModalVisible} 
        onClose={() => setModalVisible(false)} 
        horseId={horse.id}
      />

      {/* AI 진단 섹션 */}
      <Text style={styles.sectionTitle}>AI 진단</Text>
      <View style={styles.aiCardRow}>
        <TouchableOpacity style={[styles.aiCard, { backgroundColor: '#4f6ef7' }]} onPress={() => navigation.navigate('AIAnalysis', { horse, analysisType: 'lameness' })}>
          <Text style={styles.aiCardIcon}>🦿</Text>
          <Text style={styles.aiCardTitle}>파행 진단</Text>
          <Text style={styles.aiCardDesc}>보행 영상으로 분석</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.aiCard, { backgroundColor: '#10b981' }]} onPress={() => navigation.navigate('AIAnalysis', { horse, analysisType: 'hoof' })}>
          <Text style={styles.aiCardIcon}>🐾</Text>
          <Text style={styles.aiCardTitle}>발굽 분석</Text>
          <Text style={styles.aiCardDesc}>발굽 사진으로 분석</Text>
        </TouchableOpacity>
      </View>

      {/* 기본 정보 섹션 */}
      <Text style={styles.sectionTitle}>기본 정보</Text>
      <View style={styles.infoCard}>
        
        <View style={styles.infoItem}><Text style={styles.infoLabel}>담당자</Text><Text style={styles.infoValue}>{horse.manager || '홍길동'}</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>성별</Text><Text style={styles.infoValue}>{horse.gender === 'MALE' ? '수컷' : '암컷'}</Text></View>
        <View style={styles.divider} />
        <View style={styles.infoItem}><Text style={styles.infoLabel}>생년월일</Text><Text style={styles.infoValue}>{horse.birthDate || '-'}</Text></View>
      </View>
    </ScrollView>
  );
}

// 스타일은 이전과 동일 (생략)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  profileCard: { backgroundColor: '#4f6ef7', alignItems: 'center', paddingVertical: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconText: { fontSize: 42 },
  horseName: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  horseBreed: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  infoRow: { flexDirection: 'row', gap: 10 },
  infoBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  infoBadgeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  infoBadgeValue: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e2d6b', marginLeft: 20, marginBottom: 12, marginTop: 4 },
  recordButton: { backgroundColor: '#fff', marginHorizontal: 16, padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#4f6ef7', borderStyle: 'dashed' },
  recordButtonText: { color: '#4f6ef7', fontWeight: 'bold', fontSize: 16 },
  aiCardRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  aiCard: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center', elevation: 4 },
  aiCardIcon: { fontSize: 36, marginBottom: 8 },
  aiCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  aiCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 24, paddingHorizontal: 16 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1e2d6b' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
});