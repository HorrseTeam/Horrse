import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from '../config/api';

export default function HorseListScreen({ navigation }) {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHorses = async () => {
    try {
      const response = await axios.get(`${API_URL}/horses`);
      setHorses(response.data);
    } catch (error) {
      console.error('말 목록 로드 실패:', error);
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

  const getAgeText = (birthDate) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    return `${age}살`;
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
        <Text style={styles.headerTitle}>내 말 목록</Text>
        <Text style={styles.headerSub}>{horses.length}마리 등록됨</Text>
      </View>

      {horses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🐴</Text>
          <Text style={styles.emptyText}>등록된 말이 없습니다.</Text>
          <Text style={styles.emptySubText}>홈 탭에서 말을 등록해주세요.</Text>
        </View>
      ) : (
        <FlatList
          data={horses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.horseCard}
              onPress={() => navigation.navigate('HorseDetail', { horse: item })}
              activeOpacity={0.75}
            >
              <View style={styles.horseIconCircle}>
                <Text style={styles.horseIconText}>{getBreedIcon(item.breed)}</Text>
              </View>
              <View style={styles.horseInfo}>
                <Text style={styles.horseName}>{item.name}</Text>
                <Text style={styles.horseBreed}>{item.breed}</Text>
                <Text style={styles.horseBirth}>생년월일: {item.birthDate}  {getAgeText(item.birthDate)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  list: { padding: 16 },
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
    backgroundColor: '#eef1ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  horseIconText: { fontSize: 26 },
  horseInfo: { flex: 1 },
  horseName: { fontSize: 17, fontWeight: '700', color: '#1e2d6b' },
  horseBreed: { fontSize: 13, color: '#6b7cbe', marginTop: 2 },
  horseBirth: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  chevron: { fontSize: 26, color: '#c0c8e8', fontWeight: '300' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1e2d6b' },
  emptySubText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
});
