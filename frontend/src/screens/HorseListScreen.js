import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SectionList,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_URL from '../config/api';

// 🎯 초성 추출 유틸 함수 예외 처리 완비 (단독 자음, 영문, 숫자 대응)
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
  
  // 3. 영문 또는 숫자일 경우 대문자 맵핑
  const firstChar = str.charAt(0).toUpperCase();
  if (/[A-Z0-9]/.test(firstChar)) {
    return firstChar;
  }
  
  return '#'; // 특수 기호 그룹화
};

export default function HorseListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState([]); 
  const [totalCount, setTotalCount] = useState(0);

  const sectionListRef = useRef(null);

  // 🎯 서버 데이터 스트림을 초성별 Section 데이터로 가공하는 핵심 유닛
  const processHorseData = (dataArray) => {
    if (!dataArray || dataArray.length === 0) {
      setSections([]);
      setTotalCount(0);
      return;
    }

    setTotalCount(dataArray.length);

    // 1. 이름순 가나다 기본 정렬
    const sortedData = [...dataArray].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    // 2. 초성별 섹션 데이터 그룹화 맵 생성
    const sectionMap = {};
    sortedData.forEach(horse => {
      const initial = getChosung(horse.name);
      if (!sectionMap[initial]) {
        sectionMap[initial] = [];
      }
      sectionMap[initial].push(horse);
    });

    // 3. SectionList 가 요구하는 배열 포맷팅 및 정렬
    const sectionArray = Object.keys(sectionMap).map(key => ({
      title: key,
      data: sectionMap[key]
    })).sort((a, b) => a.title.localeCompare(b.title, 'ko'));

    setSections(sectionArray);
  };

  // 📡 백엔드로부터 말 목록 데이터를 가져오는 비동기 함수
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
      processHorseData([]); // 에러 발생 시 빈 리스트 처리로 크래시 방지
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 화면 포커싱 시 자동 리로드 연동
  useFocusEffect(
    useCallback(() => {
      fetchHorses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHorses();
  };

  // 인덱스 클릭 시 해당 섹션으로 자동 스크롤 함수
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
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
            // 🎯 미렌더링 스크롤 오류 시 앱 터짐 방지 콜백 핸들러
            onScrollToIndexFailed={(info) => {
              console.log("인덱스 가상 스크롤 렌더링 최적화 예외 대치:", info);
            }}
          />

          {/* 우측 빠른 스크롤 ㄱㄴㄷ 인덱스 사이드 바 */}
          <View style={styles.indexBarContainer}>
            {sections.map((section, idx) => (
              <TouchableOpacity
                key={section.title}
                style={styles.indexItem}
                onPress={() => scrollToSection(idx)}
                hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }} // 터치 인식 범위 확장 보정
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
  chevron: { fontSize: 26, color: '#c0c8e8', fontWeight: '300' },
  indexBarContainer: { position: 'absolute', right: 6, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', width: 24 },
  indexItem: { paddingVertical: 3, width: '100%', alignItems: 'center' },
  indexText: { fontSize: 11, fontWeight: '700', color: '#4f6ef7' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1e2d6b' },
  emptySubText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
});