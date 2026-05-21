import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, FlatList, Dimensions } from 'react-native';
import axios from 'axios';
import API_URL from '../config/api';

const { height } = Dimensions.get('window');

export default function HorseProfileScreen() {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('MALE');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [manager, setManager] = useState('');
  const [horses, setHorses] = useState([]);

  // 년, 월, 일 기본값 세팅 (현재 시점 기준 유연성 확보)
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [day, setDay] = useState(18);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeType, setActiveType] = useState('year'); 

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 🎯 [버그 수정] 선택한 년/월에 맞춰 윤년 및 말일(28, 29, 30, 31일)을 실시간 자동 계산하는 안전장치
  const getDaysInMonth = (targetYear, targetMonth) => {
    return new Date(targetYear, targetMonth, 0).getDate();
  };

  const daysCount = getDaysInMonth(year, month);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  // 🎯 [주의 보정] 월을 바꾸다가 기존에 선택된 '일'이 말일보다 커지면 최대 말일로 강제 자동 보정
  useEffect(() => {
    if (day > daysCount) {
      setDay(daysCount);
    }
  }, [year, month, daysCount]);

  const fetchHorses = async () => {
    try {
      const response = await axios.get(`${API_URL}/horses`);
      setHorses(response.data || []);
    } catch (error) {
      console.error("말 목록을 불러오지 못했습니다.", error);
    }
  };

  useEffect(() => {
    fetchHorses();
  }, []);

  const openPicker = (type) => {
    setActiveType(type);
    setModalVisible(true);
  };

  const handleSelect = (item) => {
    if (activeType === 'year') setYear(item);
    if (activeType === 'month') setMonth(item);
    if (activeType === 'day') setDay(item);
    setModalVisible(false);
  };

  const getFormattedBirthDate = () => {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const handleRegister = async () => {
    const birthDateStr = getFormattedBirthDate(); 

    if (!name.trim() || !breed.trim() || !registrationNumber.trim()) {
      Alert.alert("알림", "모든 필수 항목을 입력해주세요.");
      return;
    }

    const finalManager = manager.trim() === '' ? '미지정' : manager.trim();

    try {
      await axios.post(`${API_URL}/horses`, { 
        name: name.trim(), 
        breed: breed.trim(), 
        birthDate: birthDateStr, 
        gender,
        registrationNumber: registrationNumber.trim(), 
        manager: finalManager
      });

      Alert.alert("성공", `${name}이(가) 등록되었습니다.`);
      
      // 입력 폼 초기화 및 기본값 재포지셔닝
      setName('');
      setBreed('');
      setGender('MALE');
      setRegistrationNumber('');
      setManager('');
      setYear(2026);
      setMonth(5);
      setDay(18);
      
      // 등록 후 리스트 동적 리프레시
      fetchHorses();
    } catch (error) {
      console.error("말 등록 에러:", error);
      Alert.alert("등록 실패", "서버 통신 중 문제가 발생하여 마필을 등록하지 못했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>말 등록</Text>
        <Text style={styles.headerSub}>새로운 마필 정보를 입력해주세요</Text>
      </View>
    
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>신규 말 등록</Text>
        <View style={styles.card}>
          
          <Text style={styles.label}>담당 관리사 이름</Text>
          <TextInput 
            style={styles.input} 
            placeholder="예: 홍길동" 
            value={manager}
            onChangeText={setManager}
          />

          <Text style={styles.label}>마적 등록번호 *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="예: KOR012345" 
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            autoCapitalize="characters" // 등록번호 영문 대문자 자동 전환
          />

          <Text style={styles.label}>마필 이름 *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="예: 호올스" 
            value={name}
            onChangeText={setName}
          />
          
          <Text style={styles.label}>품종 *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="예: 더러브렛, 제주마" 
            value={breed}
            onChangeText={setBreed}
          />

          <Text style={styles.label}>성별</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity 
              style={[styles.genderButton, gender === 'MALE' && styles.genderButtonActive]} 
              onPress={() => setGender('MALE')}
            >
              <Text style={[styles.genderText, gender === 'MALE' && styles.genderTextActive]}>수컷</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.genderButton, gender === 'FEMALE' && styles.genderButtonActive]} 
              onPress={() => setGender('FEMALE')}
            >
              <Text style={[styles.genderText, gender === 'FEMALE' && styles.genderTextActive]}>암컷</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>생년월일</Text>
          <View style={styles.pickerRow}>
            <TouchableOpacity style={styles.dateSelectorBox} onPress={() => openPicker('year')}>
              <Text style={styles.dateSelectorText}>{year}년</Text>
              <Text style={styles.downArrow}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateSelectorBox} onPress={() => openPicker('month')}>
              <Text style={styles.dateSelectorText}>{month}월</Text>
              <Text style={styles.downArrow}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateSelectorBox} onPress={() => openPicker('day')}>
              <Text style={styles.dateSelectorText}>{day}일</Text>
              <Text style={styles.downArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>마필 마스터 등록하기</Text>
          </TouchableOpacity>
        </View>

        {/* 🎯 [동적 피드백] 순수 백엔드 DB 결과 바인딩 레일 */}
        {horses.length > 0 && <Text style={styles.sectionTitle}>현재 등록된 마필 목록 ({horses.length}마리)</Text>}
        {horses.map((horse) => (
          <View key={horse.id || horse.registrationNumber} style={styles.horseItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.horseName}>🐴 {horse.name} <Text style={styles.horseBreed}>({horse.breed})</Text></Text>
              <View style={styles.genderTag}>
                <Text style={styles.genderTagText}>{horse.gender === 'MALE' ? '수컷' : '암컷'}</Text>
              </View>
            </View>
            <View style={styles.itemBody}>
              <Text style={styles.horseSub}>• 등록번호: {horse.registrationNumber}</Text>
              <Text style={styles.horseSub}>• 담당 관리사: {horse.manager}</Text>
              <Text style={styles.horseSub}>• 생년월일: {horse.birthDate}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 하단 휠 스크롤 대치 슬라이딩 모달 피커 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeType === 'year' ? '연도 선택' : activeType === 'month' ? '월 선택' : '일 선택'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>취소</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={activeType === 'year' ? years : activeType === 'month' ? months : days}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.itemRow} onPress={() => handleSelect(item)}>
                  <Text style={[
                    styles.itemText,
                    (activeType === 'year' && year === item) ||
                    (activeType === 'month' && month === item) ||
                    (activeType === 'day' && day === item) ? styles.selectedItemText : null
                  ]}>
                    {item}{activeType === 'year' ? '년' : activeType === 'month' ? '월' : '일'}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.listScroll}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scrollContainer: { flex: 1, padding: 16 },
  header: { backgroundColor: '#4f6ef7', paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1e293b', marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e2d6b', marginTop: 12, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, shadowColor: '#4f6ef7', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  label: { fontSize: 13, color: '#475569', marginBottom: 8, fontWeight: '600' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 15, backgroundColor: '#f8faff', color: '#1e293b' },
  genderContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff' },
  genderButtonActive: { backgroundColor: '#4f6ef7', borderColor: '#4f6ef7' },
  genderText: { color: '#64748b', fontWeight: '600' },
  genderTextActive: { color: '#fff' },
  button: { backgroundColor: '#4f6ef7', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  horseItem: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10, shadowColor: '#4f6ef7', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 },
  horseName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  horseBreed: { fontSize: 13, color: '#64748b', fontWeight: 'normal' },
  genderTag: { backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  genderTagText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  itemBody: { gap: 2 },
  horseSub: { fontSize: 13, color: '#475569' },

  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 16 },
  dateSelectorBox: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8faff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12 },
  dateSelectorText: { fontSize: 15, fontWeight: '500', color: '#1e293b' },
  downArrow: { fontSize: 10, color: '#94a3b8' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: height * 0.4, paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  closeText: { fontSize: 14, color: '#4f6ef7', fontWeight: '600' },
  listScroll: { flex: 1 },
  itemRow: { paddingVertical: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  itemText: { fontSize: 16, color: '#475569' },
  selectedItemText: { color: '#4f6ef7', fontWeight: 'bold', fontSize: 18 },
});