import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from '../config/api';

export default function DashboardScreen({ navigation }) {
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchRecentData = async () => {
        try {
          const res = await axios.get(`${API_URL}/diagnosis/recent`); 
          if (res.data && res.data.length > 0) {
            setRecentDiagnoses(res.data.slice(0, 5));
          } else {
            setRecentDiagnoses([]);
          }
        } catch (err) {
          console.error('Dashboard 데이터 로드 실패:', err);
          Alert.alert("연동 에러", "실시간 시스템 현황을 가져오지 못했습니다.");
          setRecentDiagnoses([]);
        } finally {
          setLoading(false);
        }
      };

      fetchRecentData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f6ef7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>말 관리 시스템 현황</Text>
        <Text style={styles.headerSubtitle}>전체 마필의 최근 진단 요약입니다.</Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>최근 AI 분석 알림</Text>
        {recentDiagnoses.length > 0 ? (
          recentDiagnoses.map((diag, idx) => (
            <TouchableOpacity 
              key={`${diag.horseId}-${idx}`} 
              style={[
                styles.miniCard, 
                { borderLeftColor: diag.isLameness ? '#f44336' : '#10b981' }
              ]}
              onPress={() => navigation.navigate('DashboardDetail', { 
                horse: {
                  id: diag.horseId,
                  name: diag.horseName,
                  breed: diag.breed || '제주마'
                } 
              })}
            >
              <View style={styles.cardContent}>
                <Text style={styles.horseName}>{diag.horseName} <Text style={styles.horseId}>#ID {diag.horseId}</Text></Text>
                <Text style={styles.diagSummary}>
                  {diag.analysisType === 'hoof' ? '🐾 발굽 분석' : '🦿 파행 진단'}: 
                  <Text style={{ fontWeight: '700', color: diag.isLameness ? '#f44336' : '#10b981' }}>
                    {diag.isLameness ? ' 이상 감지' : ' 정상'}
                  </Text>
                </Text>
              </View>
              <Text style={styles.arrow}>〉</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noDataText}>최근 진단 데이터가 없습니다.</Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate('HorseList')}
      >
        <Text style={styles.actionButtonText}>전체 마필 목록 보기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8faff' },
  header: { padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e2d6b' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  summarySection: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e2d6b', marginBottom: 16 },
  miniCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderLeftWidth: 4,
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2 
  },
  cardContent: { flex: 1 },
  horseName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  horseId: { fontSize: 12, color: '#94a3b8', fontWeight: 'normal' },
  diagSummary: { fontSize: 13, color: '#64748b', marginTop: 4 },
  arrow: { fontSize: 16, color: '#cbd5e1', fontWeight: 'bold', paddingLeft: 8 },
  noDataText: { textAlign: 'center', color: '#94a3b8', marginTop: 20, backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  actionButton: { 
    marginHorizontal: 20, 
    marginVertical: 10,
    backgroundColor: '#4f6ef7', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});