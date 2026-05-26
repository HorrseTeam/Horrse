import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SectionList,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_URL from '../config/api';

const getChosung = (str) => {
  const chosungs = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
    'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  if (!str) return '';

  const charCode = str.charCodeAt(0);

  const code = charCode - 44032;
  if (code >= 0 && code < 11172) {
    return chosungs[Math.floor(code / 588)];
  }

  if (charCode >= 0x3131 && charCode <= 0x314E) {
    return str.charAt(0);
  }

  const firstChar = str.charAt(0).toUpperCase();
  if (/[A-Z0-9]/.test(firstChar)) {
    return firstChar;
  }

  return '#';
};

export default function HorseListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const sectionListRef = useRef(null);

  const processHorseData = (dataArray) => {
    if (!dataArray || dataArray.length === 0) {
      setSections([]);
      setTotalCount(0);
      return;
    }

    setTotalCount(dataArray.length);

    const sortedData = [...dataArray].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    const sectionMap = {};
    sortedData.forEach(horse => {
      const initial = getChosung(horse.name);
      if (!sectionMap[initial]) {
        sectionMap[initial] = [];
      }
      sectionMap[initial].push(horse);
    });

    const sectionArray = Object.keys(sectionMap).map(key => ({
      title: key,
      data: sectionMap[key]
    })).sort((a, b) => a.title.localeCompare(b.title, 'ko'));

    setSections(sectionArray);
  };

  const fetchHorses = async () => {
    try {
      const response = await axios.get(`${API_URL}/horses`);
      processHorseData(response.data || []);
    } catch (error) {
      console.error('말 목록 로드 실패:', error);
      Alert.alert(
          "오류",
          "말 목록을 불러오는 데 실패했습니다.\n서버 연결을 확인해주세요."
      );
      processHorseData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteHorse = (horseId, horseName) => {
    Alert.alert(
        "말 삭제",
        `${horseName}을(를) 정말 삭제하시겠습니까?`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "삭제",
            style: "destructive",
            onPress: async () => {
              try {
                await axios.delete(`${API_URL}/horses/${horseId}`);
                Alert.alert("완료", `${horseName}이(가) 삭제되었습니다.`);
                fetchHorses();
              } catch (error) {
                console.error("말 삭제 실패:", error);
                Alert.alert("삭제 실패", "서버에서 삭제하지 못했습니다.");
              }
            }
          }
        ]
    );
  };

  useFocusEffect(
      useCallback(() => {
        fetchHorses();
      }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHorses();
  };

  const scrollToSection = (sectionIndex) => {
    if (sectionListRef.current && sections[sectionIndex]) {
      try {
        sectionListRef.current.scrollToLocation({
          sectionIndex: sectionIndex,
          itemIndex: 0,
          viewPosition: 0,
          animated: true
        });
      } catch (error) {
        console.warn("스크롤 위치 계산 지연:", error);
      }
    }
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
          <Text style={styles.headerTitle}>말 목록</Text>
          <Text style={styles.headerSub}>{totalCount}마리 등록됨</Text>
        </View>

        {sections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🐴</Text>
              <Text style={styles.emptyText}>등록된 말이 없습니다.</Text>
              <Text style={styles.emptySubText}>홈 탭에서 말을 등록해주세요.</Text>
            </View>
        ) : (
            <View style={styles.listWrapper}>

              <SectionList
                  ref={sectionListRef}
                  sections={sections}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={styles.list}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}

                  renderSectionHeader={({ section: { title } }) => (
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderTitle}>{title}</Text>
                      </View>
                  )}

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
                          <Text style={styles.horseBirth}>생년월일: {item.birthDate || '-'}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => handleDeleteHorse(item.id, item.name)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.deleteButton}
                        >
                          <Text style={{ fontSize: 20 }}>🗑️</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                  )}
                  onScrollToIndexFailed={(info) => {
                    console.log("인덱스 가상 스크롤 렌더링 최적화 예외 대치:", info);
                  }}
              />

              <View style={styles.indexBarContainer}>
                {sections.map((section, idx) => (
                    <TouchableOpacity
                        key={section.title}
                        style={styles.indexItem}
                        onPress={() => scrollToSection(idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
                    >
                      <Text style={styles.indexText}>{section.title}</Text>
                    </TouchableOpacity>
                ))}
              </View>
            </View>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  loadingText: { marginTop: 12, color: '#4f6ef7', fontSize: 14 },
  header: { backgroundColor: '#4f6ef7', paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  listWrapper: { flex: 1, flexDirection: 'row' },
  list: { paddingLeft: 16, paddingRight: 36, paddingTop: 12, paddingBottom: 40 },
  sectionHeader: { paddingVertical: 6, paddingHorizontal: 4, backgroundColor: '#f0f4ff', marginBottom: 6 },
  sectionHeaderTitle: { fontSize: 14, fontWeight: 'bold', color: '#4f6ef7' },
  horseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#4f6ef7', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  horseIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#eef1ff', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  horseIconText: { fontSize: 26 },
  horseInfo: { flex: 1 },
  horseName: { fontSize: 17, fontWeight: '700', color: '#1e2d6b' },
  horseBreed: { fontSize: 13, color: '#4f6ef7', marginTop: 2 },
  horseBirth: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  deleteButton: { padding: 8 },
  indexBarContainer: { position: 'absolute', right: 6, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', width: 24 },
  indexItem: { paddingVertical: 3, width: '100%', alignItems: 'center' },
  indexText: { fontSize: 11, fontWeight: '700', color: '#4f6ef7' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1e2d6b' },
  emptySubText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
});