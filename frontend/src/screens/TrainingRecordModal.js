import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import API_URL from '../config/api';

export default function TrainingRecordModal({ isVisible, onClose, horseId }) {
  const [trainingType, setTrainingType] = useState('');
  const [trainingTime, setTrainingTime] = useState('');
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [appetite, setAppetite] = useState('보통');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false); // 🎯 중복 저장 요청을 차단하기 위한 상태

  // 폼 초기화 함수
  const resetForm = () => {
    setTrainingType('');
    setTrainingTime('');
    setTemperature('');
    setHeartRate('');
    setAppetite('보통');
    setNotes('');
  };

  const handleSave = async () => {
    // 1. 필수 입력 데이터 유효성 검사 (Validation)
    if (!trainingType.trim()) {
      Alert.alert("입력 오류", "훈련 종목을 입력해주세요. (예: 평보, 구보)");
      return;
    }
    if (!trainingTime.trim()) {
      Alert.alert("입력 오류", "훈련 시간을 입력해주세요.");
      return;
    }
    if (!temperature.trim()) {
      Alert.alert("입력 오류", "체온을 입력해주세요.");
      return;
    }
    if (!heartRate.trim()) {
      Alert.alert("입력 오류", "심박수를 입력해주세요.");
      return;
    }

    // 2. 🎯 [추가] 잘못된 숫자/소수점 입력 데이터 유효성 예외 가드
    const parsedTime = parseInt(trainingTime, 10);
    const parsedTemp = parseFloat(temperature);
    const parsedHeart = parseInt(heartRate, 10);

    if (isNaN(parsedTime) || parsedTime <= 0) {
      Alert.alert("입력 오류", "훈련 시간은 올바른 숫자로 입력해주세요.");
      return;
    }
    if (isNaN(parsedTemp) || parsedTemp < 30 || parsedTemp > 45) {
      Alert.alert("입력 오류", "체온 범위가 비정상적입니다. 다시 확인해주세요.");
      return;
    }
    if (isNaN(parsedHeart) || parsedHeart <= 0) {
      Alert.alert("입력 오류", "심박수는 올바른 숫자로 입력해주세요.");
      return;
    }

    const finalNotes = notes.trim() === '' ? '특이사항 없음' : notes.trim();
    setLoading(true);

    try {
      // 📡 [변경] 백엔드 DB 연동 데이터 파이프라인 전송
      // 📡 실제 백엔드 엔드포인트: POST /api/records
      await axios.post(`${API_URL}/records`, {
        horseId,
        trainingType: trainingType.trim(),
        trainingTime: parsedTime,
        temperature: parsedTemp,
        heartRate: parsedHeart,
        appetite,
        notes: finalNotes 
      });
      
      Alert.alert("저장 완료", "훈련·컨디션 기록이 안전하게 저장되었습니다.");
      resetForm();
      onClose();
    } catch (error) {
      console.error("훈련 기록 저장 실패:", error);
      Alert.alert("저장 실패", "서버 통신 중 문제가 발생하여 기록을 저장하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>📊 오늘 훈련 기록</Text>
            
            <Text style={styles.inputLabel}>훈련 종목 *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="예: 평보, 구보" 
              value={trainingType} 
              onChangeText={setTrainingType}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>훈련 시간 (분) *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0" 
              keyboardType="numeric" 
              value={trainingTime} 
              onChangeText={setTrainingTime}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>체온 (°C) *</Text>
            <TextInput 
              style={[styles.input, parseFloat(temperature) >= 38.5 && styles.warningInput]} 
              placeholder="37.5" 
              keyboardType="decimal-pad" 
              value={temperature} 
              onChangeText={setTemperature} 
              editable={!loading}
            />
            {parseFloat(temperature) >= 38.5 && <Text style={styles.warningText}>⚠️ 체온이 평소보다 다소 높습니다.</Text>}

            <Text style={styles.inputLabel}>심박수 (bpm) *</Text>
            <TextInput 
              style={[styles.input, parseInt(heartRate, 10) >= 50 && styles.warningInput]} 
              placeholder="40" 
              keyboardType="numeric" 
              value={heartRate} 
              onChangeText={setHeartRate} 
              editable={!loading}
            />
            {parseInt(heartRate, 10) >= 50 && <Text style={styles.warningText}>⚠️ 심박수가 정상 범위를 초과했습니다.</Text>}

            <Text style={styles.inputLabel}>식욕 상태</Text>
            <View style={styles.appetiteRow}>
              {['좋음', '보통', '나쁨'].map((item) => (
                <TouchableOpacity 
                  key={item} 
                  style={[styles.appetiteBtn, appetite === item && styles.appetiteBtnActive]}
                  onPress={() => setAppetite(item)}
                  disabled={loading}
                >
                  <Text style={[styles.appetiteBtnText, appetite === item && styles.appetiteBtnTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>특이사항</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
              placeholder="훈련 중 관찰된 특이사항 입력" 
              multiline 
              value={notes} 
              onChangeText={setNotes} 
              editable={!loading}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); onClose(); }} disabled={loading}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>저장</Text>
                )}
              </TouchableOpacity>
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
  input: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 16, color: '#1e293b' },
  warningInput: { borderColor: '#ef4444', color: '#ef4444' },
  warningText: { color: '#ef4444', fontSize: 12, marginTop: -12, marginBottom: 16, fontWeight: '600' },
  appetiteRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  appetiteBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff' },
  appetiteBtnActive: { backgroundColor: '#4f6ef7', borderColor: '#4f6ef7' },
  appetiteBtnText: { color: '#64748b', fontWeight: '600' },
  appetiteBtnTextActive: { color: '#fff' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#4f6ef7', alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});