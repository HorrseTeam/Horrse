import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import API_URL from '../config/api';

const screenWidth = Dimensions.get('window').width;

export default function DashboardDetailScreen({ route }) {
  const { horse } = route.params;
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/diagnosis/${horse.id}`)
      .then(res => setDiagnoses(res.data))
      .catch(err => console.log('Dashboard DB Error:', err))
      .finally(() => setLoading(false));
  }, [horse.id]);

  const chartData = {
    labels: ['1주차', '2주차', '3주차', '4주차', '5주차', '6주차'],
    datasets: [{ data: [37.5, 37.8, 38.0, 37.6, 37.9, 38.2], strokeWidth: 2 }],
  };

  // 진단 요약 통계
  const lamenessCount = diagnoses.filter(d => d.isLameness).length;
  const normalCount = diagnoses.filter(d => !d.isLameness).length;

  return (
    <ScrollView style={styles.container}>
      {/* 말 프로필 */}
      <View style={styles.profileBanner}>
        <Text style={styles.profileIcon}>🐴</Text>
        <View>
          <Text style={styles.profileName}>{horse.name}</Text>
          <Text style={styles.profileBreed}>{horse.breed}</Text>
        </View>
      </View>

      {/* 통계 카드 */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#fff7f0', borderColor: '#fdba74' }]}>
          <Text style={styles.statIcon}>🩺</Text>
          <Text style={styles.statValue}>{diagnoses.length}</Text>
          <Text style={styles.statLabel}>총 진단</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={styles.statValue}>{lamenessCount}</Text>
          <Text style={styles.statLabel}>이상 감지</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>{normalCount}</Text>
          <Text style={styles.statLabel}>정상</Text>
        </View>
      </View>

      {/* 체온 추이 차트 */}
      <Text style={styles.sectionTitle}>체온 추이 (주간)</Text>
      <View style={styles.chartCard}>
        <LineChart
          data={chartData}
          width={screenWidth - 48}
          height={200}
          yAxisSuffix="°C"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#fff7f0',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(60, 30, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '5', strokeWidth: '2', stroke: '#f97316' },
          }}
          bezier
          style={{ marginVertical: 4, borderRadius: 12 }}
        />
      </View>

      {/* 최근 AI 진단 이력 */}
      <Text style={styles.sectionTitle}>최근 AI 진단 이력</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#f97316" style={{ marginVertical: 20 }} />
      ) : diagnoses.length > 0 ? (
        diagnoses.slice(0, 10).map((diag, idx) => (
          <View key={idx} style={[styles.diagCard, { borderLeftColor: diag.isLameness ? '#f44336' : '#10b981' }]}>
            <View style={styles.diagHeader}>
              <Text style={styles.diagType}>파행 진단</Text>
              <Text style={[styles.diagResult, { color: diag.isLameness ? '#f44336' : '#10b981' }]}>
                {diag.isLameness ? '⚠️ 이상 감지' : '✅ 정상'}
              </Text>
            </View>
            <Text style={styles.diagWalk}>보행 모드: {diag.walkType} / {diag.walkDirection}</Text>
            <Text style={styles.diagDate}>{new Date(diag.createdAt).toLocaleString('ko-KR')}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyDiag}>
          <Text style={styles.emptyDiagIcon}>📋</Text>
          <Text style={styles.emptyDiagText}>아직 진단 이력이 없습니다.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7f0' },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  profileIcon: { fontSize: 40 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileBreed: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1e2d6b' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7c3a00',
    marginLeft: 20,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 24,
    shadowColor: '#f97316',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  diagCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  diagHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  diagType: { fontSize: 14, fontWeight: '600', color: '#1e2d6b' },
  diagResult: { fontSize: 13, fontWeight: '600' },
  diagWalk: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  diagDate: { fontSize: 11, color: '#94a3b8' },
  emptyDiag: { alignItems: 'center', padding: 30 },
  emptyDiagIcon: { fontSize: 40, marginBottom: 8 },
  emptyDiagText: { color: '#94a3b8', fontSize: 14 },
});
