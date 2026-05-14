import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import API_URL from '../config/api';

const screenWidth = Dimensions.get('window').width;

export default function DashboardDetailScreen({ route }) {
  const { horse } = route.params;
  const [diagnoses, setDiagnoses] = useState([]); // AI 진단 이력
  const [records, setRecords] = useState([]);     // 훈련·컨디션 기록 (체온/심박수)
  const [loading, setLoading] = useState(true);

  // 1. 데이터 통합 로드 (AI 진단 + 컨디션 기록)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {

        const dummyRecords = [
        { "temperature": 37.5, "heartRate": 38, "createdAt": "2026-05-08T09:00:00Z" },
        { "temperature": 37.8, "heartRate": 42, "createdAt": "2026-05-10T10:30:00Z" },
        { "temperature": 38.2, "heartRate": 48, "createdAt": "2026-05-12T08:15:00Z" },
        { "temperature": 37.9, "heartRate": 41, "createdAt": "2026-05-13T09:00:00Z" },
        { "temperature": 37.6, "heartRate": 40, "createdAt": "2026-05-14T11:00:00Z" }
      ];

        const [diagRes, recordRes] = await Promise.all([
          axios.get(`${API_URL}/diagnosis/${horse.id}`),
          axios.get(`${API_URL}/training-records/${horse.id}`) // 서버에 해당 엔드포인트 필요
        ]);
        
        // 날짜순 정렬 (차트 시각화용)
        const sortedRecords = recordRes.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        setDiagnoses(diagRes.data);
        setRecords(sortedRecords);
      } catch (err) {
        console.log('데이터 로드 에러:', err);
        setRecords([
        { "temperature": 37.5, "heartRate": 38, "createdAt": "2026-05-08T09:00:00Z" },
        { "temperature": 37.8, "heartRate": 42, "createdAt": "2026-05-10T10:30:00Z" },
        { "temperature": 38.2, "heartRate": 48, "createdAt": "2026-05-12T08:15:00Z" },
        { "temperature": 37.9, "heartRate": 41, "createdAt": "2026-05-13T09:00:00Z" },
        { "temperature": 37.6, "heartRate": 40, "createdAt": "2026-05-14T11:00:00Z" }
      ]);
      
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [horse.id]);

  // 2. 통합 차트 데이터 구성 (실제 입력된 데이터 추출)
  const chartData = {
    // 최근 7개 기록의 날짜 추출 (MM/DD 형식)
    labels: records.length > 0 
      ? records.slice(-7).map(r => {
          const d = new Date(r.createdAt);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        })
      : ['데이터 없음'],
    datasets: [
      {
        data: records.length > 0 ? records.slice(-7).map(r => r.temperature) : [0],
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`, // 주황색 (체온)
        strokeWidth: 2
      },
      {
        data: records.length > 0 ? records.slice(-7).map(r => r.heartRate) : [0],
        color: (opacity = 1) => `rgba(79, 110, 247, ${opacity})`, // 파란색 (심박수)
        strokeWidth: 2
      }
    ],
    legend: ['체온(°C)', '심박수(bpm)'] // 범례 표시
  };

  // 3. 통계 계산
  const lamenessCount = diagnoses.filter(d => d.isLameness).length;
  const normalCount = diagnoses.filter(d => !d.isLameness).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f6ef7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 말 프로필 배너 (각진 디자인 적용) */}
      <View style={styles.profileBanner}>
        <Text style={styles.profileIcon}>🐴</Text>
        <View>
          <Text style={styles.profileName}>{horse.name}</Text>
          <Text style={styles.profileBreed}>{horse.breed}</Text>
        </View>
      </View>

      {/* 통계 카드 섹션 */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#f8f9ff', borderColor: '#fdba74' }]}>
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

      {/* 통합 컨디션 차트 섹션 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>컨디션 통합 지표 </Text>
        <TouchableOpacity><Text style={styles.filterText}>기간 필터 📅</Text></TouchableOpacity>
      </View>
      
      <View style={styles.chartCard}>
        {records.length > 0 ? (
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              propsForDots: { r: '4', strokeWidth: '2' },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 12 }}
          />
        ) : (
          <Text style={styles.noDataText}>기록된 컨디션 데이터가 없습니다.</Text>
        )}
      </View>

      {/* 최근 AI 진단 이력 카드 리스트 */}
      <Text style={styles.sectionTitle}>최근 AI 진단 이력</Text>
      {diagnoses.length > 0 ? (
        diagnoses.slice(0, 10).map((diag, idx) => (
          <View key={idx} style={[styles.diagCard, { borderLeftColor: diag.isLameness ? '#f44336' : '#10b981' }]}>
            <View style={styles.diagHeader}>
              <Text style={styles.diagType}>{diag.analysisType === 'hoof' ? '🐾 발굽 분석' : '🦿 파행 진단'}</Text>
              <Text style={[styles.diagResult, { color: diag.isLameness ? '#f44336' : '#10b981' }]}>
                {diag.isLameness ? '⚠️ 이상 감지' : '✅ 정상'}
              </Text>
            </View>
            <Text style={styles.diagWalk}>
              {diag.analysisType === 'hoof' ? `방향: ${diag.walkDirection}` : `보행: ${diag.walkType} / ${diag.walkDirection}`}
            </Text>
            <Text style={styles.diagDate}>{new Date(diag.createdAt).toLocaleString('ko-KR')}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyDiag}>
          <Text style={styles.emptyDiagText}>진단 이력이 없습니다.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f6ef7',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 14,
    // 하단 각지게 설정
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 20,
  },
  profileIcon: { fontSize: 40 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  profileBreed: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1e2d6b' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e2d6b', marginLeft: 20, marginBottom: 12 },
  filterText: { fontSize: 13, color: '#4f6ef7', fontWeight: '600' },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 24,
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center'
  },
  noDataText: { padding: 40, color: '#94a3b8' },
  diagCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
  },
  diagHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  diagType: { fontSize: 14, fontWeight: '700', color: '#1e2d6b' },
  diagResult: { fontSize: 13, fontWeight: '700' },
  diagWalk: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  diagDate: { fontSize: 11, color: '#94a3b8' },
  emptyDiag: { alignItems: 'center', padding: 40 },
  emptyDiagText: { color: '#94a3b8' },
});