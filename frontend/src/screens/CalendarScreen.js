import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import API_URL from '../config/api';

export default function CalendarScreen() {
  const [selected, setSelected] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [title, setTitle] = useState('');
  
  // Note: For demo purposes, assuming horseId = 1 exists. In a full app you'd select the horse.
  const HORSE_ID = 1;

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API_URL}/schedules/horse/${HORSE_ID}`);
      setSchedules(res.data);
    } catch (error) {
      console.log('일정 로드 실패:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleAddSchedule = async () => {
    if (!selected) {
      Alert.alert('알림', '캘린더에서 날짜를 먼저 선택해주세요!');
      return;
    }
    if (!title) {
        Alert.alert('알림', '일정 내용을 입력해주세요!');
        return;
    }

    try {
      // eventDate requires ISO DateTime format backend-side: e.g., "2023-11-01T00:00:00"
      await axios.post(`${API_URL}/schedules`, {
        horseId: HORSE_ID,
        title: title,
        eventDate: `${selected}T10:00:00`,
        notify: true
      });
      setTitle('');
      fetchSchedules();
      Alert.alert('성공', '일정이 등록되었습니다!');
    } catch (error) {
      Alert.alert('에러', '일정 등록에 실패했습니다.');
    }
  };

  // Convert fetched schedules list into react-native-calendars markedDates format
  const marks = {};
  schedules.forEach(s => {
      // s.eventDate format is like "2023-11-05T10:00:00"
      const dateKey = s.eventDate.split('T')[0];
      marks[dateKey] = { marked: true, dotColor: 'blue', act: s.title };
  });
  
  // Overwrite the selected day to show highlighting
  const currentMarkings = {
      ...marks,
      ...(selected ? { [selected]: { ...(marks[selected] || {}), selected: true, selectedDotColor: 'orange' } } : {})
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>일정 관리 (캘린더)</Text>
      <View style={styles.calendarWrapper}>
        <Calendar
          onDayPress={day => {
            setSelected(day.dateString);
          }}
          markedDates={currentMarkings}
          theme={{
            selectedDayBackgroundColor: '#00adf5',
            todayTextColor: '#00adf5',
            arrowColor: 'orange',
          }}
        />
      </View>
      
      <View style={styles.detailsContainer}>
        {selected ? (
          <>
            <Text style={styles.dateTitle}>{selected}</Text>
            {marks[selected] && marks[selected].act ? (
              <View style={styles.eventCard}>
                <Text style={styles.eventText}>{marks[selected].act}</Text>
              </View>
            ) : (
              <Text style={styles.noEventText}>이 날짜에 등록된 일정이 없습니다.</Text>
            )}
            
            <View style={styles.addEventBox}>
                <TextInput 
                    style={styles.input} 
                    placeholder="새로운 일정 입력 (예: 예방접종)"
                    value={title}
                    onChangeText={setTitle}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
                    <Text style={styles.addButtonText}>DB에 진짜로 등록하기</Text>
                </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.placeholderText}>새로운 일정을 추가하거나 확인하려면 날짜를 먼저 선택하세요.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', margin: 16, color: '#333' },
  calendarWrapper: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 16 },
  detailsContainer: { padding: 16 },
  dateTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  eventCard: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#4caf50', marginBottom: 16 },
  eventText: { fontSize: 16, color: '#333' },
  noEventText: { fontSize: 14, color: '#888', fontStyle: 'italic', marginBottom: 16 },
  placeholderText: { fontSize: 14, color: '#aaa', textAlign: 'center', marginTop: 20 },
  addEventBox: { marginTop: 10, padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginBottom: 10 },
  addButton: { backgroundColor: '#ff9800', padding: 14, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
