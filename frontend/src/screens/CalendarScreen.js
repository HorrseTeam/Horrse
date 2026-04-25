import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, Platform
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from '../config/api';

export default function NewCalendarScreen() {
  const [selected, setSelected] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [horses, setHorses] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [showModal, setShowModal] = useState(false);

  // 등록 폼 상태
  const [formHorseId, setFormHorseId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [showHorsePicker, setShowHorsePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const TIME_OPTIONS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00'
  ];

  const fetchData = useCallback(async () => {
    try {
      const [horsesRes] = await Promise.all([
        axios.get(`${API_URL}/horses`),
      ]);
      setHorses(horsesRes.data);

      // 등록된 말들의 일정 모두 가져오기
      const scheduleResults = await Promise.all(
        horsesRes.data.map(h =>
          axios.get(`${API_URL}/schedules/horse/${h.id}`).catch(() => ({ data: [] }))
        )
      );
      const allSchedules = scheduleResults.flatMap(r => r.data);
      setSchedules(allSchedules);
    } catch (error) {
      console.log('데이터 로드 실패:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleAddSchedule = async () => {
    if (!formHorseId) { Alert.alert('알림', '말을 선택해주세요!'); return; }
    if (!formTitle) { Alert.alert('알림', '일정 제목을 입력해주세요!'); return; }
    if (!formDate) { Alert.alert('알림', '날짜를 선택해주세요!'); return; }

    try {
      await axios.post(`${API_URL}/schedules`, {
        horseId: formHorseId,
        title: formTitle,
        description: formContent,
        eventDate: `${formDate}T${formTime}:00`,
        notify: true,
      });
      Alert.alert('성공', '일정이 등록되었습니다!');
      setFormTitle('');
      setFormContent('');
      setFormDate('');
      setFormTime('10:00');
      setFormHorseId(null);
      setShowModal(false);
      fetchData();
    } catch (error) {
      Alert.alert('에러', '일정 등록에 실패했습니다.');
    }
  };

  // 마킹 데이터
  const marks = {};
  schedules.forEach(s => {
    if (!s.eventDate) return;
    const dateKey = s.eventDate.split('T')[0];
    marks[dateKey] = {
      marked: true,
      dotColor: '#f97316',
      schedules: [...(marks[dateKey]?.schedules || []), s],
    };
  });

  const currentMarkings = {
    ...marks,
    ...(selected
      ? {
          [selected]: {
            ...(marks[selected] || {}),
            selected: true,
            selectedColor: '#4f6ef7',
            selectedTextColor: '#fff',
          },
        }
      : {}),
  };

  const selectedSchedules = selected && marks[selected]?.schedules
    ? marks[selected].schedules
    : schedules
        .filter(s => s.eventDate?.split('T')[0] === selected)
        .slice(0, 5);

  const getHorseName = (horseId) => {
    const h = horses.find(h => h.id === horseId);
    return h ? h.name : `말 #${horseId}`;
  };

  // 현재 주 날짜 계산 (주간 뷰용 간단 표시)
  const getWeekDays = () => {
    const today = new Date();
    const days = [];
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>일정</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { setFormDate(selected || ''); setShowModal(true); }}
        >
          <Text style={styles.addButtonText}>+ 등록</Text>
        </TouchableOpacity>
      </View>

      {/* 뷰 전환 탭 */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'month' && styles.toggleBtnActive]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>월간</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>주간</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* 월간 캘린더 */}
        {viewMode === 'month' && (
          <View style={styles.calendarCard}>
            <Calendar
              onDayPress={day => setSelected(day.dateString)}
              markedDates={currentMarkings}
              theme={{
                selectedDayBackgroundColor: '#4f6ef7',
                todayTextColor: '#f97316',
                arrowColor: '#4f6ef7',
                dotColor: '#f97316',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
              }}
            />
          </View>
        )}

        {/* 주간 뷰 */}
        {viewMode === 'week' && (
          <View style={styles.weekCard}>
            <View style={styles.weekRow}>
              {weekDays.map((d, i) => {
                const dateStr = d.toISOString().split('T')[0];
                const hasEvent = !!marks[dateStr];
                const isSelected = dateStr === selected;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.weekDay, isSelected && styles.weekDaySelected]}
                    onPress={() => setSelected(dateStr)}
                  >
                    <Text style={[styles.weekDayLabel, i === 0 && { color: '#ef4444' }, i === 6 && { color: '#3b82f6' }]}>
                      {dayLabels[i]}
                    </Text>
                    <View style={[styles.weekDateCircle, isSelected && styles.weekDateCircleSelected, isToday && !isSelected && styles.weekDateCircleToday]}>
                      <Text style={[styles.weekDateNum, isSelected && { color: '#fff' }, isToday && !isSelected && { color: '#f97316' }]}>
                        {d.getDate()}
                      </Text>
                    </View>
                    {hasEvent && <View style={styles.weekDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 선택된 날짜 일정 */}
        {selected ? (
          <View style={styles.scheduleSection}>
            <Text style={styles.selectedDate}>{selected} 일정</Text>
            {selectedSchedules.length > 0 ? (
              selectedSchedules.map((s, idx) => (
                <View key={idx} style={styles.scheduleCard}>
                  <View style={styles.scheduleTimeBar} />
                  <View style={styles.scheduleBody}>
                    <View style={styles.scheduleTop}>
                      <Text style={styles.scheduleTitle}>{s.title}</Text>
                      <Text style={styles.scheduleHorse}>🐴 {getHorseName(s.horseId)}</Text>
                    </View>
                    {s.description ? (
                      <Text style={styles.scheduleContent}>{s.description}</Text>
                    ) : null}
                    <Text style={styles.scheduleTime}>
                      🕐 {s.eventDate ? s.eventDate.replace('T', ' ').slice(0, 16) : '-'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noSchedule}>이 날짜에 등록된 일정이 없습니다.</Text>
            )}
          </View>
        ) : (
          <View style={styles.placeholderSection}>
            <Text style={styles.placeholderIcon}>📅</Text>
            <Text style={styles.placeholderText}>날짜를 선택하면 일정을 확인하거나 추가할 수 있습니다.</Text>
          </View>
        )}
      </ScrollView>

      {/* 일정 등록 모달 */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>일정 등록</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* 말 선택 */}
              <Text style={styles.formLabel}>말 선택 *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowHorsePicker(!showHorsePicker)}
              >
                <Text style={formHorseId ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                  {formHorseId ? getHorseName(formHorseId) : '말을 선택해주세요'}
                </Text>
                <Text style={styles.dropdownArrow}>{showHorsePicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showHorsePicker && (
                <View style={styles.dropdownList}>
                  {horses.map(h => (
                    <TouchableOpacity
                      key={h.id}
                      style={[styles.dropdownItem, formHorseId === h.id && styles.dropdownItemActive]}
                      onPress={() => { setFormHorseId(h.id); setShowHorsePicker(false); }}
                    >
                      <Text style={[styles.dropdownItemText, formHorseId === h.id && { color: '#fff' }]}>
                        🐴 {h.name} ({h.breed})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 제목 */}
              <Text style={styles.formLabel}>일정 제목 *</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 예방접종, 편자 교체"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              {/* 세부 내용 */}
              <Text style={styles.formLabel}>세부 내용</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="세부 내용을 입력하세요"
                value={formContent}
                onChangeText={setFormContent}
                multiline
                numberOfLines={3}
              />

              {/* 날짜 */}
              <Text style={styles.formLabel}>날짜 *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (예: 2025-05-01)"
                value={formDate}
                onChangeText={setFormDate}
                keyboardType="numeric"
              />

              {/* 시간 선택 */}
              <Text style={styles.formLabel}>시각</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowTimePicker(!showTimePicker)}
              >
                <Text style={styles.dropdownSelected}>🕐 {formTime}</Text>
                <Text style={styles.dropdownArrow}>{showTimePicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <View style={styles.dropdownList}>
                  {TIME_OPTIONS.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.dropdownItem, formTime === t && styles.dropdownItemActive]}
                      onPress={() => { setFormTime(t); setShowTimePicker(false); }}
                    >
                      <Text style={[styles.dropdownItemText, formTime === t && { color: '#fff' }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddSchedule}>
              <Text style={styles.submitButtonText}>등록</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4f6ef7',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#e8eeff',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: '#4f6ef7' },
  toggleText: { fontWeight: '600', color: '#6b7cbe' },
  toggleTextActive: { color: '#fff' },
  calendarCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  weekCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { alignItems: 'center', flex: 1 },
  weekDaySelected: {},
  weekDayLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  weekDateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDateCircleSelected: { backgroundColor: '#4f6ef7' },
  weekDateCircleToday: { borderWidth: 2, borderColor: '#f97316' },
  weekDateNum: { fontSize: 15, fontWeight: '600', color: '#1e2d6b' },
  weekDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#f97316', marginTop: 4 },
  scheduleSection: { paddingHorizontal: 16 },
  selectedDate: { fontSize: 15, fontWeight: '700', color: '#1e2d6b', marginBottom: 12 },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleTimeBar: { width: 5, backgroundColor: '#4f6ef7' },
  scheduleBody: { flex: 1, padding: 14 },
  scheduleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  scheduleTitle: { fontSize: 15, fontWeight: '700', color: '#1e2d6b', flex: 1 },
  scheduleHorse: { fontSize: 12, color: '#f97316', fontWeight: '600' },
  scheduleContent: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  scheduleTime: { fontSize: 12, color: '#94a3b8' },
  noSchedule: { color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
  placeholderSection: { alignItems: 'center', padding: 40 },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderText: { color: '#94a3b8', textAlign: 'center', fontSize: 14 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e2d6b' },
  modalClose: { fontSize: 22, color: '#94a3b8' },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8faff',
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f8faff',
  },
  dropdownSelected: { fontSize: 15, color: '#1e293b' },
  dropdownPlaceholder: { fontSize: 15, color: '#94a3b8' },
  dropdownArrow: { fontSize: 12, color: '#94a3b8' },
  dropdownList: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemActive: { backgroundColor: '#4f6ef7' },
  dropdownItemText: { fontSize: 14, color: '#1e293b' },
  submitButton: {
    backgroundColor: '#4f6ef7',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
