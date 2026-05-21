import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SectionList,
  ActivityIndicator, RefreshControl
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from '../config/api';

// 🎯 [수정] 자음 단독 입력 및 영문/숫자 예외 처리 강화
const getChosung = (str) => {
  const chosungs = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
    'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  if (!str) return '';
  
  const charCode = str.charCodeAt(0);
  
  // 1. 일반적인 한글 조합형 음절 분해 (가 ~ 힣)
  const code = charCode - 44032;
  if (code >= 0 && code < 11172) {
    return chosungs[Math.floor(code / 588)];
  }
  
  // 2. 단독 자음으로 시작하는 경우 (ㄱ ~ ㅎ)
  if (charCode >= 0x3131 && charCode <= 0x314E) {
    return str.charAt(0);
  }
  
  // 3. 영문 또는 기타 문자일 경우 대문자 변환 혹은 기호 처리
  const firstChar = str.charAt(0).toUpperCase();
  if (/[A-Z0-9]/.test(firstChar)) {
    return firstChar;
  }
  
  return '#'; // 특수 기호 그룹화
};

export default function DashboardHorseListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const sectionListRef = useRef(null);

  // 데이터 초성 그룹화 처리 핵심 유닛
  const processHorseData = (dataArray) => {
    if (!dataArray || dataArray.length === 0) {
      setSections([]);
      setTotalCount(0);
      return;
    }

    setTotalCount(dataArray.length);

    // 가나다순 정렬
    const sortedData = [...dataArray].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    // 초성별 Map 적재
    const sectionMap = {};
    sortedData.forEach(horse => {
      const initial = getChosung(horse.name);
      if (!sectionMap[initial]) {
        sectionMap[initial] = [];
      }
      sectionMap[initial].push(horse);
    });

    // SectionList 스펙 배열로 가공 및 초성 키 정렬
    const sectionArray = Object.keys(sectionMap).map(key => ({
      title: key,
      data: sectionMap[key]
    })).sort((a, b) => a.title.localeCompare(b.title, 'ko'));

    setSections(sectionArray);
  };

  const fetchHorses = async () => {
    try {
      const response = await axios.get(`${API_URL}/horses`);
      if (response.data && response.data.length > 0) {
        processHorseData(response.data);
      } else {
        processHorseData([]);
      }
    } catch (error) {
      console.error('말 목록 로드 실패:', error);
      
      // 서버 오프라인 대비 임시 로컬 데이터 폴백 라우트
      const dummyData = [
        { id: 1, name: "강풍", breed: "더러브렛", birthDate: "2019-04-12" },
        { id: 2, name: "감귤이", breed: "제주마", birthDate: "2021-08-20" },
        { id: 3, name: "샛별", breed: "제주마", birthDate: "2020-01-05" },
        { id: 4, name: "에이스", breed: "더러브렛", birthDate: "2018-11-30" },
        { id: 5, name: "태풍", breed: "더러브렛", birthDate: "2022-02-15" },
      ];
      processHorseData(dummyData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  // 🎯 [수정] scrollToLocation 렌더링 크래시 방지 우회 로직 추가
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
        console.warn("스크롤 위치 계산 실패 (미렌더링 구역):", error);
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
        <Text style={styles.headerTitle}>대시보드</Text>
        <Text style={styles.headerSub}>말을 선택하면 건강 데이터를 확인할 수 있습니다</Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>등록된 말이 없습니다.</Text>
          <Text style={styles.emptySubText}>홈 탭에서 말을 먼저 등록해주세요.</Text>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          
          <SectionList
            ref={sectionListRef}
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              <Text style={styles.listHeader}>등록된 말 ({totalCount}마리)</Text>
            }
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>{title}</Text>
              </View>
            )}
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
            // 🎯 미렌더링 인덱스로 스크롤 할 때 Native crash 차단용 안전장치 추가
            onScrollToIndexFailed={(info) => {
              console.log("인덱스 스크롤 내부 유효성 확보 안 됨:", info);
            }}
          />

          {/* 우측 인덱스 퀵 점프 레일 */}
          <View style={styles.indexBarContainer}>
            {sections.map((section, idx) => (
              <TouchableOpacity
                key={section.title}
                style={styles.indexItem}
                onPress={() => scrollToSection(idx)}
                hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }} // 터치 미스 보정 확장
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
  header: {
    backgroundColor: '#4f6ef7',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  listWrapper: { flex: 1, flexDirection: 'row' },
  list: { paddingLeft: 16, paddingRight: 38, paddingTop: 12, paddingBottom: 40 }, 
  
  sectionHeader: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: '#f0f4ff',
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4f6ef7',
  },

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

  indexBarContainer: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  indexItem: {
    paddingVertical: 3,
    width: '100%',
    alignItems: 'center',
  },
  indexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f6ef7',
  },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#000' },
  emptySubText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
});