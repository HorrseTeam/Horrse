import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';

export default function HorseDetailScreen({ route, navigation }) {
  const { horse } = route.params;

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
    return now.getFullYear() - birth.getFullYear() + '살';
  };

  return (
    <ScrollView style={styles.container}>
      {/* 말 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{getBreedIcon(horse.breed)}</Text>
        </View>
        <Text style={styles.horseName}>{horse.name}</Text>
        <Text style={styles.horseBreed}>{horse.breed}</Text>
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
            <Text style={styles.infoBadgeValue}>#{horse.id}</Text>
          </View>
        </View>
      </View>

      {/* AI 진단 섹션 */}
      <Text style={styles.sectionTitle}>AI 진단</Text>
      <View style={styles.aiCardRow}>
        <TouchableOpacity
          style={[styles.aiCard, { backgroundColor: '#4f6ef7' }]}
          onPress={() =>
            navigation.navigate('AIAnalysis', { horse, analysisType: 'lameness' })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.aiCardIcon}>🦿</Text>
          <Text style={styles.aiCardTitle}>파행 진단</Text>
          <Text style={styles.aiCardDesc}>보행 영상으로{'\n'}파행 여부 분석</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.aiCard, { backgroundColor: '#10b981' }]}
          onPress={() =>
            navigation.navigate('AIAnalysis', { horse, analysisType: 'hoof' })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.aiCardIcon}>🐾</Text>
          <Text style={styles.aiCardTitle}>발굽 분석</Text>
          <Text style={styles.aiCardDesc}>발굽 사진으로{'\n'}상태 분석</Text>
        </TouchableOpacity>
      </View>

      {/* 추가 정보 섹션 */}
      <Text style={styles.sectionTitle}>기본 정보</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>말 이름</Text>
          <Text style={styles.infoValue}>{horse.name}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>품종</Text>
          <Text style={styles.infoValue}>{horse.breed || '-'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>생년월일</Text>
          <Text style={styles.infoValue}>{horse.birthDate || '-'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>나이</Text>
          <Text style={styles.infoValue}>{getAge(horse.birthDate)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  profileCard: {
    backgroundColor: '#4f6ef7',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: { fontSize: 42 },
  horseName: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  horseBreed: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 16 },
  infoRow: { flexDirection: 'row', gap: 10 },
  infoBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  infoBadgeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  infoBadgeValue: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e2d6b',
    marginLeft: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  aiCardRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  aiCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  aiCardIcon: { fontSize: 36, marginBottom: 8 },
  aiCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  aiCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1e2d6b' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
});
