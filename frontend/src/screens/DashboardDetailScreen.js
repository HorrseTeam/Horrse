import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator, 
  TouchableOpacity, Platform, Alert, Modal, TextInput, KeyboardAvoidingView 
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import API_URL from '../config/api'; // 설정해두신 백엔드 주소 활용

const screenWidth = Dimensions.get('window').width;

export default function DashboardDetailScreen({ route, navigation }) {
  // 이전 화면(말 목록 등)에서 넘겨받은 horse 정보 활용 (없으면 기본값)
  const horse = route?.params?.horse || { id: 1, name: '샛별', breed: '제주마' };

  // 🎯 [변경] 더미 데이터를 모두 제거하고 빈 배열 상태로 관리
  const [records, setRecords] = useState([]);       // 컨디션 추이 그래프 데이터
  const [trainings, setTrainings] = useState([]);     // 훈련 일지 목록
  const [diagnoses, setDiagnoses] = useState([]);     // AI 분석 이력 목록
  const [loading, setLoading] = useState(false);

  // 기본 조회 기간: 최근 일주일 설정
  const [startDate, setStartDate] = useState(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // 수정 모달 상태 관리
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editTemp, setEditTemp] = useState('');
  const [editHeart, setEditHeart] = useState('');
  const [editAppetite, setEditAppetite] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // 날짜 포맷 변환 유틸 (YYYY-MM-DD)
  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 📡 [기능 추가] 백엔드로부터 대시보드 통합 데이터를 가져오는 함수
  const fetchDashboardData = async (start, end) => {
    if (start > end) {
      Alert.alert('조회 오류', '시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    // 일주일(7일) 제한 유효성 검사
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) { 
      Alert.alert('조회 제한', '조회 기간은 최대 일주일(7일)까지만 가능합니다.');
      return;
    }

    loading || setLoading(true);

    try {
      // 쿼리 스트링 파라미터 구성
      const params = {
        horseId: horse.id,
        startDate: formatDateString(start),
        endDate: formatDateString(end),
      };

      // 백엔드 API 호출 (엔드포인트는 설계에 맞춰 조율 가능)
      const response = await axios.get(`${API_URL}/dashboard/${horse.id}`);
      const { trainingRecords, lamenessDiagnoses, hoofDiagnoses } = response.data;

      // 훈련 기록: date 기준 오름차순 정렬 (차트용)
      const sortedRecords = (trainingRecords || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      // 일지는 최신순 정렬
      const sortedTrainings = (trainingRecords || []).sort((a, b) => new Date(b.date) - new Date(a.date));

      // AI 진단 이력: lameness + hoof 통합
      const allDiagnoses = [
        ...(lamenessDiagnoses || []).map(d => ({ ...d, analysisType: 'lameness' })),
        ...(hoofDiagnoses || []).map(d => ({ ...d, analysisType: 'hoof' })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setRecords(sortedRecords);
      setTrainings(sortedTrainings);
      setDiagnoses(allDiagnoses);
    } catch (error) {
      console.error("Dashboard 로딩 실패:", error);
      Alert.alert("데이터 로드 실패", "서버에서 정보를 가져오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 화면 진입 시 최초 데이터 로드
  useEffect(() => {
    fetchDashboardData(startDate, endDate);
  }, []);

  // 훈련일지 수정 모달 오픈 및 폼 바인딩
  const handleEditTraining = (id) => {
    const target = trainings.find(t => t.id === id);
    if (!target) return;

    setEditingId(id);
    setEditType(target.trainingType);
    setEditTime(String(target.trainingTime));
    setEditTemp(String(target.temperature));
    setEditHeart(String(target.heartRate));
    setEditAppetite(target.appetite);
    setEditNotes(target.notes);
    
    setShowEditModal(true);
  };

  // 📡 [변경] 수정한 내용을 백엔드 DB에 PUT 요청으로 반영
  const saveEditedTraining = async () => {
    try {
      const updatedBody = {
        trainingType: editType,
        temperature: Number(editTemp),
        heartRate: Number(editHeart),
        appetite: editAppetite,
        notes: editNotes
      };

      // 📡 실제 백엔드 엔드포인트: PUT /api/records/{id}
      await axios.put(`${API_URL}/records/${editingId}`, updatedBody);
      
      setShowEditModal(false);
      if (Platform.OS !== 'web') Alert.alert("완료", "일지가 수정되었습니다.");
      
      // 수정 후 최신 목록으로 서버 데이터 갱신
      fetchDashboardData(startDate, endDate);
    } catch (error) {
      console.error("일지 수정 실패:", error);
      Alert.alert("수정 에러", "서버에 수정사항을 반영하지 못했습니다.");
    }
  };

  // 📡 [변경] 일지 삭제를 백엔드 DB에 DELETE 요청으로 반영
  const handleDeleteTraining = (id) => {
    const performDelete = async () => {
      try {
        // 📡 실제 백엔드 엔드포인트: DELETE /api/records/{id}
        await axios.delete(`${API_URL}/records/${id}`);
        if (Platform.OS !== 'web') Alert.alert("삭제 완료", "일지가 삭제되었습니다.");
        // 삭제 후 목록 새로고침
        fetchDashboardData(startDate, endDate);
      } catch (error) {
        console.error("일지 삭제 실패:", error);
        Alert.alert("삭제 에러", "서버에서 일지를 삭제하는 중 문제가 발생했습니다.");
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("이 일지를 정말로 삭제하시겠습니까?")) performDelete();
    } else {
      Alert.alert(
        "훈련 일지 삭제",
        "이 일지를 정말로 삭제하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "삭제", style: "destructive", onPress: performDelete }
        ]
      );
    }
  };

  // 날짜 조정 화살표 버튼 이벤트 핸들러
  const adjustDate = (type, direction) => {
    let current = type === 'start' ? new Date(startDate) : new Date(endDate);
    if (direction === 'up') {
      current.setDate(current.getDate() + 1);
    } else {
      current.setDate(current.getDate() - 1);
    }
    
    if (type === 'start') {
      setStartDate(current);
      fetchDashboardData(current, endDate);
    } else {
      setEndDate(current);
      fetchDashboardData(startDate, current);
    }
  };

  const onStartChange = (event, selectedDate) => {
    if (Platform.OS !== 'ios') setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      fetchDashboardData(selectedDate, endDate);
    }
  };

  const onEndChange = (event, selectedDate) => {
    if (Platform.OS !== 'ios') setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      fetchDashboardData(startDate, selectedDate);
    }
  };

  const handleWebDateChange = (type, valStr) => {
    if (!valStr) return;
    const nextDate = new Date(valStr);
    if (type === 'start') {
      setStartDate(nextDate);
      fetchDashboardData(nextDate, endDate);
    } else {
      setEndDate(nextDate);
      fetchDashboardData(startDate, nextDate);
    }
  };

  // 📊 차트 컴포넌트 공급용 데이터 정제
  const chartData = {
    labels: records.length > 0 ? records.map(r => { 
      const d = new Date(r.date);
      return `${d.getMonth() + 1}/${d.getDate()}`; 
    }) : ['-'],
    datasets: [
      { data: records.length > 0 ? records.map(r => r.temperature ?? 0) : [0], color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`, strokeWidth: 2 },
      { data: records.length > 0 ? records.map(r => r.heartRate ?? 0) : [0], color: (opacity = 1) => `rgba(79, 110, 247, ${opacity})`, strokeWidth: 2 }
    ],
    legend: ['체온(°C)', '심박수(bpm)']
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.profileBanner}>
          <Text style={styles.profileIcon}>🐴</Text>
          <View>
            <Text style={styles.profileName}>{horse.name}</Text>
            <Text style={styles.profileBreed}>{horse.breed}</Text>
          </View>
        </View>

        {/* 기간 필터 바 */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>기간</Text>
          
          <View style={styles.dateBlock}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => adjustDate('start', 'down')}><Text style={styles.arrowText}>◀</Text></TouchableOpacity>
            {Platform.OS === 'web' ? (
              <input type="date" value={formatDateString(startDate)} onChange={(e) => handleWebDateChange('start', e.target.value)} style={webInputStyle} />
            ) : (
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.datePickerText}>{formatDateString(startDate)}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.arrowBtn} onPress={() => adjustDate('start', 'up')}><Text style={styles.arrowText}>▶</Text></TouchableOpacity>
          </View>
          
          <Text style={styles.tilde}>-</Text>
          
          <View style={styles.dateBlock}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => adjustDate('end', 'down')}><Text style={styles.arrowText}>◀</Text></TouchableOpacity>
            {Platform.OS === 'web' ? (
              <input type="date" value={formatDateString(endDate)} onChange={(e) => handleWebDateChange('end', e.target.value)} style={webInputStyle} />
            ) : (
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.datePickerText}>{formatDateString(endDate)}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.arrowBtn} onPress={() => adjustDate('end', 'up')}><Text style={styles.arrowText}>▶</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={() => fetchDashboardData(startDate, endDate)}><Text style={styles.searchButtonText}>조회</Text></TouchableOpacity>
        </View>

        {Platform.OS !== 'web' && showStartPicker && (
          <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={onStartChange} />
        )}
        {Platform.OS !== 'web' && showEndPicker && (
          <DateTimePicker value={endDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={onEndChange} />
        )}

        {loading ? (
          <View style={styles.loadingCard}><ActivityIndicator size="large" color="#4f6ef7" /></View>
        ) : (
          <>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>컨디션 추이</Text></View>
            <View style={styles.chartCard}>
              <LineChart
                data={chartData} width={screenWidth - 40} height={200}
                chartConfig={{ backgroundColor: '#ffffff', backgroundGradientFrom: '#ffffff', backgroundGradientTo: '#ffffff', decimalPlaces: 1, color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`, propsForDots: { r: '4', strokeWidth: '2' } }}
                bezier style={{ marginVertical: 8, borderRadius: 12 }}
              />
            </View>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>🏃‍♂️ 훈련 및 컨디션 일지</Text></View>
            {trainings.length > 0 ? (
              trainings.map((item) => (
                <View key={item.id} style={styles.trainingCard}>
                  <View style={styles.trainingHeader}>
                    <Text style={styles.trainingType}>{item.trainingType}</Text>
                    <View style={styles.timeBadge}><Text style={styles.timeBadgeText}>{item.trainingTime}분</Text></View>
                  </View>
                  
                  <View style={styles.healthRow}>
                    <Text style={[styles.healthText, item.temperature >= 38.5 && styles.textAlert]}>{"체온: "}<Text style={styles.boldText}>{item.temperature}°C</Text></Text>
                    <Text style={[styles.healthText, item.heartRate >= 50 && styles.textAlert]}>{"심박: "}<Text style={styles.boldText}>{item.heartRate}bpm</Text></Text>
                    <Text style={styles.healthText}>{"식욕: "}<Text style={styles.boldText}>{item.appetite}</Text></Text>
                  </View>
                  
                  <View style={styles.innerDivider} />
                  <Text style={styles.trainingNotes}><Text style={{fontWeight: '700', color: '#475569'}}>특이사항: </Text>{item.notes}</Text>
                  
                  <View style={styles.innerDivider} />
                  
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.trainingDate}>{item.date ? new Date(item.date).toLocaleDateString() : '-'} 기록</Text>
                    
                    <View style={styles.actionButtonContainer}>
                      <TouchableOpacity style={styles.editInlineBtn} onPress={() => handleEditTraining(item.id)}>
                        <Text style={styles.editInlineText}>수정</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteInlineBtn} onPress={() => handleDeleteTraining(item.id)}>
                        <Text style={styles.deleteInlineText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}><Text style={styles.emptyText}>선택한 기간에 등록된 훈련 일지가 없습니다.</Text></View>
            )}

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>AI 분석/진단 이력</Text></View>
            {diagnoses.length > 0 ? (
              diagnoses.map((diag, idx) => (
                  <TouchableOpacity key={idx} style={styles.diagCard} onPress={() => navigation.navigate('AIDetail', { resultData: diag, analysisType: diag.analysisType })}>
                  <View style={styles.diagHeader}>
                    <View style={styles.typeTag}><Text style={styles.diagType}>{diag.analysisType === 'hoof' ? '🐾 발굽 분석' : '🦿 파행 진단'}</Text></View>
                    <Text style={styles.statusLabel}>{diag.resultStatus}</Text>
                  </View>
                  <View style={styles.diagContent}>
                    <Text style={styles.infoText}>{diag.analysisType === 'hoof' ? "" : `보행: ${diag.walkType} / 촬영 방향: ${diag.walkDirection}`}</Text>
                    <Text style={styles.dateText}>{new Date(diag.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.moreButton}>상세 결과 〉</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}><Text style={styles.emptyText}>선택한 기간에 분석 이력이 존재하지 않습니다.</Text></View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 훈련 일지 수정 팝업 모달 */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        {/* 키보드가 인풋 영역을 가리지 않도록 KeyboardAvoidingView 처리 */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>훈련 일지 수정</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>훈련 종류</Text>
              <TextInput style={styles.input} value={editType} onChangeText={setEditType} />

              <Text style={styles.formLabel}>훈련 시간 (분)</Text>
              <TextInput style={styles.input} value={editTime} onChangeText={setEditTime} keyboardType="numeric" />

              <Text style={styles.formLabel}>체온 (°C)</Text>
              <TextInput style={styles.input} value={editTemp} onChangeText={setEditTemp} keyboardType="numeric" />

              <Text style={styles.formLabel}>심박수 (bpm)</Text>
              <TextInput style={styles.input} value={editHeart} onChangeText={setEditHeart} keyboardType="numeric" />

              <Text style={styles.formLabel}>식욕 상태</Text>
              <TextInput style={styles.input} value={editAppetite} onChangeText={setEditAppetite} />

              <Text style={styles.formLabel}>특이사항</Text>
              <TextInput style={[styles.input, styles.inputMultiline]} value={editNotes} onChangeText={setEditNotes} multiline numberOfLines={3} />
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={saveEditedTraining}>
              <Text style={styles.submitButtonText}>수정 완료</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const webInputStyle = {
  border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '600', color: '#334155', textAlign: 'center', outline: 'none', width: '100px', padding: '2px 0'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  loadingCard: { height: 300, justifyContent: 'center', alignItems: 'center' },
  profileBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f6ef7', padding: 25, gap: 15 },
  profileIcon: { fontSize: 40 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  profileBreed: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  filterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 15, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, elevation: 2 },
  filterLabel: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  dateBlock: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 2, backgroundColor: '#fff' },
  arrowBtn: { padding: 6 },
  arrowText: { fontSize: 10, color: '#64748b' },
  datePickerButton: { width: 85, paddingVertical: 4, justifyContent: 'center', alignItems: 'center' },
  datePickerText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  tilde: { fontSize: 14, color: '#64748b' },
  searchButton: { backgroundColor: '#4f6ef7', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  searchButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  chartCard: { backgroundColor: '#fff', borderRadius: 15, marginHorizontal: 16, padding: 10, elevation: 2, alignItems: 'center' },
  
  trainingCard: { backgroundColor: '#fff', borderRadius: 15, marginHorizontal: 16, padding: 16, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  trainingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  trainingType: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  timeBadge: { backgroundColor: '#e8eeff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  timeBadgeText: { fontSize: 12, color: '#4f6ef7', fontWeight: '700' },
  
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  healthText: { fontSize: 13, color: '#475569' },
  boldText: { fontWeight: '700', color: '#1e293b' },
  textAlert: { color: '#ef4444', fontWeight: 'bold' },
  innerDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  trainingNotes: { fontSize: 13, color: '#64748b', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, lineHeight: 18 },
  
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  trainingDate: { fontSize: 11, color: '#94a3b8' },
  actionButtonContainer: { flexDirection: 'row', gap: 8 },
  
  editInlineBtn: { backgroundColor: '#f1f5f9', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  editInlineText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  deleteInlineBtn: { backgroundColor: '#fff1f2', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#fecdd3' },
  deleteInlineText: { fontSize: 11, color: '#e11d48', fontWeight: '600' },

  diagCard: { backgroundColor: '#fff', borderRadius: 15, marginHorizontal: 16, padding: 18, marginBottom: 12, elevation: 2 },
  diagHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  diagType: { fontSize: 13, fontWeight: '600', color: '#475569' },
  statusLabel: { fontSize: 14, fontWeight: '700', color: '#1e2d6b' },
  diagContent: { marginBottom: 12 },
  infoText: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  dateText: { fontSize: 11, color: '#94a3b8' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 10 },
  moreButton: { fontSize: 12, color: '#4f6ef7', fontWeight: 'bold', textAlign: 'right' },
  emptyContainer: { alignItems: 'center', padding: 30, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { color: '#94a3b8', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e2d6b' },
  modalClose: { fontSize: 22, color: '#94a3b8' },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, fontSize: 14, color: '#1e293b', backgroundColor: '#f8faff' },
  inputMultiline: { height: 70, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#4f6ef7', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});