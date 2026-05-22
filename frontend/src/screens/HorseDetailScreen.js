import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import TrainingRecordModal from './TrainingRecordModal';

export default function HorseDetailScreen({ route, navigation }) {
  // 라우팅 파라미터가 유실되었을 때를 대비한 안전 장치 탑재
  const { horse } = route?.params || { horse: {} };
  const [isModalVisible, setModalVisible] = useState(false);

  const getBreedIcon = (breed) => {
    if (!breed) return '🐴';
    if (breed.includes('더러브렛') || breed.includes('Thoroughbred')) return '🏇';
    if (breed.includes('제주')) return '🐎';
    return '🐴';
  };

  // 🎯 [수정] 타임존 파싱 에러 및 NaN 현상을 방지하는 정교한 나이 계산식
  const getAge = (birthDate) => {
    if (!birthDate) return '-';
    try {
      const birthYear = parseInt(birthDate.split('-')[0], 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(birthYear)) return '-';

      // 한국식 세는나이 연산 기준
      return `${currentYear - birthYear + 1}살`;
    } catch {
      return '-';
    }
  };

  // 🎯 [수정] 성별 데이터 유효성 다각화
  const renderGender = (gender) => {
    if (!gender) return '-';
    switch (gender.toUpperCase()) {
      case 'MALE': return '수컷';
      case 'FEMALE': return '암컷';
      case 'GELDING': return '거세마';
      default: return gender;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 1. 말 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{getBreedIcon(horse.breed)}</Text>
        </View>
        <Text style={styles.horseName}>{horse.name || '이름 없음'}</Text>
        <Text style={styles.horseBreed}>{horse.breed || '미지정'}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeLabel}>나이</Text>
            <Text style={styles.infoBadgeValue}>{getAge(horse.birthDate)}</Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeLabel}>생년월일</Text>
            <Text style={styles.infoBadgeValue}>{horse.birthDate || '-'}</Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeLabel}>ID</Text>
            <Text style={styles.infoBadgeValue}>#{horse.registrationNumber || horse.id || '0'}</Text>
          </View>
        </View>
      </View>

      {/* 2. 훈련·컨디션 기록 버튼 섹션 */}
      <Text style={styles.sectionTitle}>훈련 및 컨디션 관리</Text>
      <TouchableOpacity
        style={styles.recordButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.recordButtonText}>📝 훈련·컨디션 기록하기</Text>
      </TouchableOpacity>

      {/* 훈련 기록 전용 모달 컴포넌트 연결 */}
      <TrainingRecordModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        horseId={horse.id}
      />

      {/* 3. AI 진단 섹션 */}
      <Text style={styles.sectionTitle}>AI 진단 요청</Text>
      <View style={styles.aiCardRow}>
        <TouchableOpacity
          style={[styles.aiCard, { backgroundColor: '#4f6ef7' }]}
          onPress={() => navigation.navigate('AIAnalysis', { horse, analysisType: 'lameness' })}
          activeOpacity={0.8}
        >
          <Text style={styles.aiCardIcon}>🦿</Text>
          <Text style={styles.aiCardTitle}>파행 진단</Text>
          <Text style={styles.aiCardDesc}>보행 영상 분석</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.aiCard, { backgroundColor: '#10b981' }]}
          onPress={() => navigation.navigate('AIAnalysis', { horse, analysisType: 'hoof' })}
          activeOpacity={0.8}
        >
          <Text style={styles.aiCardIcon}>🐾</Text>
          <Text style={styles.aiCardTitle}>발굽 분석</Text>
          <Text style={styles.aiCardDesc}>발굽 사진 분석</Text>
        </TouchableOpacity>
      </View>

      {/* 4. 마필 마스터 데이터 정보 섹션 */}
      <Text style={styles.sectionTitle}>기본 말 정보</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>담당 관리자</Text>
          <Text style={styles.infoValue}>{horse.manager || '관리자 미지정'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>성별</Text>
          <Text style={styles.infoValue}>{renderGender(horse.gender)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>등록 번호</Text>
          <Text style={styles.infoValue}>{horse.registrationNumber || '미등록 말'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  profileCard: { backgroundColor: '#4f6ef7', alignItems: 'center', paddingVertical: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 20, shadowColor: '#4f6ef7', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconText: { fontSize: 42 },
  horseName: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  horseBreed: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  infoRow: { flexDirection: 'row', gap: 10 },
  infoBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 75 },
  infoBadgeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  infoBadgeValue: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e2d6b', marginLeft: 20, marginBottom: 12, marginTop: 4 },
  recordButton: { backgroundColor: '#fff', marginHorizontal: 16, padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1.5, borderColor: '#4f6ef7', borderStyle: 'dashed' },
  recordButtonText: { color: '#4f6ef7', fontWeight: 'bold', fontSize: 16 },
  aiCardRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  aiCard: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  aiCardIcon: { fontSize: 36, marginBottom: 8 },
  aiCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  aiCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 2 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 24, paddingHorizontal: 16, shadowColor: '#4f6ef7', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1e2d6b' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
});