import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import API_URL from '../config/api';

export default function HorseProfileScreen() {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
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
    if (!name || !breed || !birthDate) {
      Alert.alert("알림", "모든 항목을 입력해주세요.");
      return;
    }

    try {
      await axios.post(`${API_URL}/horses`, { 
        name, 
        breed, 
        birthDate 
      });
      Alert.alert("성공", `${name}이(가) 등록되었습니다.`);
      setName('');
      setBreed('');
      setBirthDate('');
      fetchHorses(); // 목록 새로고침
    } catch (error) {
      Alert.alert("에러", "말을 등록하는 중 문제가 발생했습니다.");
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>신규 말 등록</Text>
      <View style={styles.card}>
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
        
        <Text style={styles.label}>생년월일 (YYYY-MM-DD)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="2020-01-01" 
          value={birthDate}
          onChangeText={setBirthDate}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>DB에 진짜로 등록하기</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>내 말 목록 ({horses.length}마리)</Text>
      {horses.map((horse) => (
        <View key={horse.id} style={styles.horseItem}>
          <Text style={styles.horseName}>{horse.name} ({horse.breed})</Text>
          <Text style={styles.horseAge}>생일: {horse.birthDate}</Text>
        </View>
      ))}
      {horses.length === 0 && (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
          아직 등록된 말이 없습니다.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333', marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  label: { fontSize: 14, color: '#555', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#4caf50', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  horseItem: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  horseName: { fontSize: 16, fontWeight: '600' },
  horseAge: { fontSize: 14, color: '#888' }
});
