import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from '../config/api';

export default function DashboardHorseListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [horses, setHorses] = useState([]);
const fetchHorses = async () => {
  try {
    const response = await axios.get(`${API_URL}/horses`);
    
    if (response.data && response.data.length > 0) {
      // 서버 데이터가 있을 때 가나다순 정렬
      const sortedData = response.data.sort((a, b) => 
        a.name.localeCompare(b.name, 'ko')
      );
      setHorses(sortedData);
    } else {
      setHorses([]);
    }
  } catch (error) {
    console.error('말 목록 로드 실패:', error);
    
    // [확인용] 서버 연결 실패 시 더미 데이터라도 띄워보려면 아래 주석을 해제하세요

      const dummyData = [
        { id: 1, name: "강풍", breed: "더러브렛", birthDate: "2019-04-12" },
        { id: 2, name: "감귤이", breed: "제주마", birthDate: "2021-08-20" },
        { id: 3, name: "샛별", breed: "제주마", birthDate: "2020-01-05" },
        { id: 4, name: "에이스", breed: "더러브렛", birthDate: "2018-11-30" },
        { id: 5, name: "태풍", breed: "더러브렛", birthDate: "2022-02-15" },
      ];

    setHorses(dummyData.sort((a, b) => a.name.localeCompare(b.name, 'ko')));

  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHorses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHorses();
  };

  const getBreedIcon = (breed) => {
    if (!breed) return '🐴';
    if (breed.includes('더러브렛') || breed.includes('Thoroughbred')) return '🏇';
    if (breed.includes('제주')) return '🐎';
    return '🐴';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f6ef7" />
        <Text style={styles.loadingText}>말 목록을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>대시보드</Text>
        <Text style={styles.headerSub}>말을 선택하면 건강 데이터를 확인할 수 있습니다</Text>
      </View>

      {horses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>등록된 말이 없습니다.</Text>
          <Text style={styles.emptySubText}>홈 탭에서 말을 먼저 등록해주세요.</Text>
        </View>
      ) : (
        <FlatList
          data={horses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <Text style={styles.listHeader}>등록된 말 ({horses.length}마리)</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.horseCard}
              onPress={() => navigation.navigate('DashboardDetail', { horse: item })}
              activeOpacity={0.75}
            >
              <View style={styles.horseIconCircle}>
                <Text style={styles.horseIconText}>{getBreedIcon(item.breed)}</Text>
              </View>
              <View style={styles.horseInfo}>
                <Text style={styles.horseName}>{item.name}</Text>
                <Text style={styles.horseBreed}>{item.breed}</Text>
                <Text style={styles.horseBirth}>생년월일: {item.birthDate}</Text>
              </View>
              <View style={styles.viewBadge}>
                <Text style={styles.viewBadgeText}>데이터 보기 →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  loadingText: { marginTop: 12, color: '#4f6ef7', fontSize: 14 },
  header: {
    backgroundColor: '#4f6ef7',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  list: { padding: 16 },
  listHeader: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  horseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  horseIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e8eeff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  horseIconText: { fontSize: 26 },
  horseInfo: { flex: 1 },
  horseName: { fontSize: 17, fontWeight: '700', color: '#000' },
  horseBreed: { fontSize: 13, color: '#4f6ef7', marginTop: 2 },
  horseBirth: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  viewBadge: {
    backgroundColor: '#e8eeff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewBadgeText: { fontSize: 11, fontWeight: '600', color: '#4f6ef7' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#000' },
  emptySubText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
});
