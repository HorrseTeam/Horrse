import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import API_URL from '../config/api';

export default function HorseProfileScreen() {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('MALE');
  const [registrationNumber, setRegistrationNumber] = useState(''); // 등록번호 추가
  const [manager,setManager] = useState('');
  const [horses, setHorses] = useState([]);

  const fetchHorses = async () => {
    try {
      const response = await axios.get(`${API_URL}/horses`);
      setHorses(response.data);
    } catch (error) {
      console.error("말 목록을 불러오지 못했습니다.", error);
    }
  };

  useEffect(() => {
    fetchHorses();
  }, []);

  const handleRegister = async () => {
    if (!name || !breed || !birthDate || !gender || !registrationNumber) {
      Alert.alert("알림", "모든 항목을 입력해주세요.");

      manager: manager.trim() === '' ? '미지정' : manager
      
      return;
    }

    try {
      await axios.post(`${API_URL}/horses`, { 
        name, 
        breed, 
        birthDate,
        gender,
        registrationNumber, // 서버로 전송할 데이터에 추가
        manager // 관리자 정보 추가
      });

      Alert.alert("성공", `${name}이(가) 등록되었습니다.`);
      
      setBreed('');
      setBirthDate('');
      setGender('MALE');
      setRegistrationNumber(''); // 등록 후 초기화
      setManager(''); // 관리자 정보 초기화
      fetchHorses();

    } catch (error) {
      Alert.alert("에러", "말을 등록하는 중 문제가 발생했습니다.");
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>신규 말 등록</Text>
      <View style={styles.card}>

        {/* 관리자 이름 입력란 추가 */}
        <Text style={styles.label}>관리자 이름</Text>
        <TextInput 
          style={styles.input} 
          placeholder="예: 홍길동" 
          value={manager}
          onChangeText={setManager}
        />

        {/* 등록번호 입력란 추가 */}
        <Text style={styles.label}>등록번호</Text>
        <TextInput 
          style={styles.input} 
          placeholder="예: KOR012345" 
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
        />



        <Text style={styles.label}>이름</Text>
        <TextInput 
          style={styles.input} 
          placeholder="예: 호올스" 
          value={name}
          onChangeText={setName}
        />
        
        <Text style={styles.label}>품종</Text>
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
        
        <Text style={styles.label}>생년월일 (YYYY-MM-DD)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="2020-01-01" 
          value={birthDate}
          onChangeText={setBirthDate}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>등록</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>내 말 목록 ({horses.length}마리)</Text>
      {horses.map((horse, index) => (
        <View key={index} style={styles.horseItem}>
          <View>
            <Text style={styles.horseName}>{horse.name} ({horse.breed})</Text>
            {/* 목록에 등록번호 표시 추가 */}
            <Text style={styles.horseSub}>번호: {horse.registrationNumber}</Text>
            <Text style={styles.horseSub}>담당자: {horse.manager || '미지정'}</Text>
            <Text style={styles.horseSub}>{horse.gender === 'MALE' ? '♂ 수컷' : '♀ 암컷'} · {horse.birthDate}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f0f4ff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333', marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#fafafa' },
  genderContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff' },
  genderButtonActive: { backgroundColor: '#4f6ef7', borderColor: '#4f6ef7' },
  genderText: { color: '#555', fontWeight: '600' },
  genderTextActive: { color: '#fff' },
  button: { backgroundColor: '#4f6ef7', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  horseItem: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, paddingHorizontal: 20, paddingVertical: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  horseName: { fontSize: 16, fontWeight: '600', color: '#333' },
  horseSub: { fontSize: 13, color: '#666', marginTop: 2 }
});