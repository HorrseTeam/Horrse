import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import API_URL from '../config/api';

export default function TrainingRecordModal({ isVisible, onClose, horseId }) {
  const [trainingType, setTrainingType] = useState('');
  const [trainingTime, setTrainingTime] = useState('');
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [appetite, setAppetite] = useState('보통');
  const [notes, setNotes] = useState('');




  const handleSave = async () => {
  // ... 유효성 검사 로직 ...

    try {
      await axios.post(`${API_URL}/training-records`, {
      horseId,
      trainingType,
      trainingTime: parseInt(trainingTime),
      temperature: parseFloat(temperature),
      heartRate: parseInt(heartRate),
      appetite,
    
      // notes가 비어있으면(falsy) '특이사항 없음'을 저장
      notes: notes.trim() === '' ? '특이사항 없음' : notes 
    });
    
    Alert.alert("성공", "훈련·컨디션 기록이 저장되었습니다.");
    onClose();

  } catch (error) {
    Alert.alert("에러", "기록 저장 중 문제가 발생했습니다.");
  }
};




  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>📊 오늘 일과 기록</Text>
            
            <Text style={styles.inputLabel}>훈련 종목</Text>
            <TextInput style={styles.input} placeholder="예: 평보, 구보" value={trainingType} onChangeText={setTrainingType} />

            <Text style={styles.inputLabel}>훈련 시간 (분)</Text>
            <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={trainingTime} onChangeText={setTrainingTime} />

            <Text style={styles.inputLabel}>체온 (°C)</Text>
            <TextInput 
              style={[styles.input, parseFloat(temperature) >= 38.5 && styles.warningInput]} 
              placeholder="37.5" keyboardType="decimal-pad" value={temperature} onChangeText={setTemperature} 
            />

            {/*37.5~38.0*/}
            {parseFloat(temperature) >= 38.5 && <Text style={styles.warningText}>체온이 높습니다</Text>}

            <Text style={styles.inputLabel}>심박수 (bpm)</Text>
            <TextInput 
              style={[styles.input, parseInt(heartRate) >= 50 && styles.warningInput]} 
              placeholder="40" keyboardType="numeric" value={heartRate} onChangeText={setHeartRate} 
            />

            {/*32~44bpm 정상*/}
            {parseInt(heartRate) >= 50 && <Text style={styles.warningText}>심박수가 높습니다</Text>}

            <Text style={styles.inputLabel}>식욕 상태</Text>
            <View style={styles.appetiteRow}>
              {['좋음', '보통', '나쁨'].map((item) => (
                <TouchableOpacity 
                  key={item} 
                  style={[styles.appetiteBtn, appetite === item && styles.appetiteBtnActive]}
                  onPress={() => setAppetite(item)}
                >
                  <Text style={[styles.appetiteBtnText, appetite === item && styles.appetiteBtnTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>특이사항</Text>
            <TextInput style={[styles.input, {height: 80}]} placeholder="특이사항 입력" multiline value={notes} onChangeText={setNotes} />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>취소</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>저장</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e2d6b', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 16 },
  warningInput: { borderColor: '#ef4444', color: '#ef4444' },
  warningText: { color: '#ef4444', fontSize: 12, marginTop: -12, marginBottom: 16, fontWeight: '600' },
  appetiteRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  appetiteBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  appetiteBtnActive: { backgroundColor: '#4f6ef7', borderColor: '#4f6ef7' },
  appetiteBtnText: { color: '#64748b', fontWeight: '600' },
  appetiteBtnTextActive: { color: '#fff' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 40 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#4f6ef7', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});