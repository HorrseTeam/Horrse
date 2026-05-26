import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, Platform, Pressable
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import API_URL from '../config/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const formatDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '10', '20', '30', '40', '50'];

export default function NewCalendarScreen() {
  const [selected, setSelected] = useState(formatDateString(new Date()));
  const [schedules, setSchedules] = useState([]);
  const [horses, setHorses] = useState([]);
  const [viewMode, setViewMode] = useState('month');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const [formHorseId, setFormHorseId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formHour, setFormHour] = useState('10');
  const [formMinute, setFormMinute] = useState('00');
  const [showHorsePicker, setShowHorsePicker] = useState(false);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [showMinutePicker, setShowMinutePicker] = useState(false);

  const deletedIds = useRef(new Set());
  const initializedFromServer = useRef(false);

  useEffect(() => {
    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('푸시 알림 권한 거부됨');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('high_importance_channel', {
          name: '중요 일정 알림',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4f6ef7',
        });
      }
    })();
  }, []);

  const schedule24HoursBeforeAlarm = async (title, horseName, eventDateString) => {
    try {
      const targetTime = new Date(eventDateString);
      const now = new Date();
      const alarmTimeInMs = targetTime.getTime() - (24 * 60 * 60 * 1000);
      const alarmDate = new Date(alarmTimeInMs);

      const notificationContent = {
        title: `🐴 [일정 알림] ${horseName} - 24시간 전`,
        body: `'${title}' 일정이 24시간 후에 시작됩니다. 준비 상태를 확인하세요!`,
        sound: true,
        android: { channelId: 'high_importance_channel' },
      };

      if (alarmDate <= now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🐴 [일정 등록 완료] ${horseName}`,
            body: `임박한 일정 '${title}'이(가) 등록되었습니다! (일정 시작: ${targetTime.toLocaleString()})`,
            sound: true,
            android: { channelId: 'high_importance_channel' },
          },
          trigger: { seconds: 1 },
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: { date: alarmDate },
        });
      }
    } catch (error) {
      console.log('푸시 알림 스케줄링 실패:', error);
    }
  };

  const applySchedules = useCallback((raw) => {
    setSchedules(raw.filter(s => !deletedIds.current.has(s.id)));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const horsesRes = await axios.get(`${API_URL}/horses`);
      setHorses(horsesRes.data);
      const scheduleResults = await Promise.all(
          horsesRes.data.map(h => axios.get(`${API_URL}/schedules/horse/${h.id}`))
      );
      const allSchedules = scheduleResults.flatMap(r => r.data);
      initializedFromServer.current = true;
      applySchedules(allSchedules);
    } catch (error) {
      console.error("일정 데이터 로드 실패:", error);
      setHorses([]);
      applySchedules([]);
    }
  }, [applySchedules]);

  useFocusEffect(
      useCallback(() => { fetchData(); }, [fetchData])
  );

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormDate('');
    setFormHour('10');
    setFormMinute('00');
    setFormHorseId(null);
    setShowModal(false);
    setShowHorsePicker(false);
    setShowHourPicker(false);
    setShowMinutePicker(false);
  };

  const handleAddSchedule = async () => {
    if (!formHorseId) { Alert.alert('알림', '말을 선택해주세요!'); return; }
    if (!formTitle.trim()) { Alert.alert('알림', '일정 제목을 입력해주세요!'); return; }
    if (!formDate) { Alert.alert('알림', '날짜를 선택해주세요!'); return; }

    const formTime = `${formHour}:${formMinute}`;
    const eventDate = `${formDate}T${formTime}:00`;
    const horseName = getHorseName(formHorseId);

    try {
      const res = await axios.post(`${API_URL}/schedules`, {
        horseId: formHorseId, title: formTitle,
        description: formContent, eventDate, notify: true,
      });
      setSchedules(prev => [res.data, ...prev]);

      await schedule24HoursBeforeAlarm(formTitle, horseName, eventDate);
      Alert.alert('성공', '일정이 등록되었습니다!');
    } catch (error) {
      console.error("일정 등록 실패:", error);
      Alert.alert('오류', '일정 등록 중 서버 오류가 발생했습니다.');
    }
    resetForm();
  };

  const handleDeleteSchedule = useCallback((id, title) => {
    Alert.alert(
        '일정 삭제',
        `'${title}' 일정을 삭제하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => {
              deletedIds.current.add(id);
              setSchedules(prev => prev.filter(item => item.id !== id));
              axios.delete(`${API_URL}/schedules/${id}`).catch(() => {
                console.log(`서버 삭제 실패: id=${id}, 로컬 삭제 유지`);
              });
              Alert.alert('성공', '일정이 삭제되었습니다.');
            },
          },
        ]
    );
  }, []);

  const getHorseName = (horseId) => {
    const h = horses.find(h => h.id === horseId);
    return h ? h.name : `말 #${horseId}`;
  };

  const getWeekDays = useCallback((offset = 0) => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + offset);
    sunday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, []);

  const getWeekRangeLabel = (days) => {
    const fmt = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
    return `${fmt(days[0])} ~ ${fmt(days[6])}`;
  };

  const weekDays = getWeekDays(weekOffset);
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const marks = {};
  schedules.forEach(s => {
    if (!s.eventDate) return;
    const dateKey = s.eventDate.split('T')[0];
    marks[dateKey] = { marked: true, dotColor: '#f97316' };
  });

  const currentMarkings = {
    ...marks,
    ...(selected ? {
      [selected]: {
        ...(marks[selected] || {}),
        selected: true,
        selectedColor: '#4f6ef7',
        selectedTextColor: '#fff',
      },
    } : {}),
  };

  const selectedSchedules = schedules.filter(
      s => s.eventDate && s.eventDate.split('T')[0] === selected
  );

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>일정 관리</Text>
            <Text style={styles.headerSub}>말들의 주요 일정을 확인하고 관리하세요</Text>
          </View>
          <TouchableOpacity
              style={styles.addButton}
              onPress={() => { setFormDate(selected || formatDateString(new Date())); setShowModal(true); }}
          >
            <Text style={styles.addButtonText}>+ 등록</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggle}>
          {['month', 'week'].map(mode => (
              <TouchableOpacity
                  key={mode}
                  style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
                  onPress={() => {
                    setViewMode(mode);
                    if (mode === 'week') {
                      const today = new Date();
                      const selDate = selected ? new Date(selected + 'T00:00:00') : today;
                      const todaySunday = new Date(today);
                      todaySunday.setDate(today.getDate() - today.getDay());
                      todaySunday.setHours(0, 0, 0, 0);
                      const selSunday = new Date(selDate);
                      selSunday.setDate(selDate.getDate() - selDate.getDay());
                      selSunday.setHours(0, 0, 0, 0);
                      setWeekOffset(Math.round((selSunday - todaySunday) / 86400000));
                    }
                  }}
              >
                <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
                  {mode === 'month' ? '월간' : '주간'}
                </Text>
              </TouchableOpacity>
          ))}
        </View>

        <ScrollView>
          {viewMode === 'month' && (
              <View style={styles.calendarCard}>
                <Calendar
                    current={selected || undefined}
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

          {viewMode === 'week' && (
              <View style={styles.weekCard}>
                <View style={styles.weekNavRow}>
                  <TouchableOpacity style={styles.weekNavBtn} onPress={() => setWeekOffset(p => p - 7)}>
                    <Text style={styles.weekNavArrow}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.weekRangeLabel}>{getWeekRangeLabel(weekDays)}</Text>
                  <TouchableOpacity style={styles.weekNavBtn} onPress={() => setWeekOffset(p => p + 7)}>
                    <Text style={styles.weekNavArrow}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.weekRow}>
                  {weekDays.map((d, i) => {
                    const dateStr = formatDateString(d);
                    const isSelected = dateStr === selected;
                    const isToday = dateStr === formatDateString(new Date());
                    return (
                        <TouchableOpacity key={i} style={styles.weekDay} onPress={() => setSelected(dateStr)}>
                          <Text style={[
                            styles.weekDayLabel,
                            i === 0 && { color: '#ef4444' },
                            i === 6 && { color: '#3b82f6' },
                          ]}>
                            {dayLabels[i]}
                          </Text>
                          <View style={[
                            styles.weekDateCircle,
                            isSelected && styles.weekDateCircleSelected,
                            isToday && !isSelected && styles.weekDateCircleToday,
                          ]}>
                            <Text style={[
                              styles.weekDateNum,
                              isSelected && { color: '#fff' },
                              isToday && !isSelected && { color: '#f97316' },
                            ]}>
                              {d.getDate()}
                            </Text>
                          </View>
                          {marks[dateStr] && <View style={styles.weekDot} />}
                        </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
          )}

          <View style={styles.scheduleSection}>
            <Text style={styles.selectedDate}>{selected || formatDateString(new Date())} 일정</Text>
            {selectedSchedules.length > 0 ? (
                selectedSchedules.map((s, idx) => (
                    <View key={`${s.id}-${idx}`} style={styles.scheduleCard}>
                      <Pressable
                          style={styles.deleteIconButton}
                          onPress={() => handleDeleteSchedule(s.id, s.title)}
                          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      >
                        <Text style={styles.deleteIconText}>🗑️</Text>
                      </Pressable>
                      <View style={styles.scheduleTimeBar} />
                      <View style={styles.scheduleBody}>
                        <View style={styles.scheduleTop}>
                          <Text style={styles.scheduleTitle} numberOfLines={1}>{s.title}</Text>
                        </View>
                        {s.description ? <Text style={styles.scheduleContent}>{s.description}</Text> : null}
                        <View style={styles.scheduleBottomRow}>
                          <Text style={styles.scheduleTime}>
                            🕐 {s.eventDate ? s.eventDate.replace('T', ' ').slice(0, 16) : '-'}
                          </Text>
                          <Text style={styles.scheduleHorseInline}>🐴 {getHorseName(s.horseId)}</Text>
                        </View>
                      </View>
                    </View>
                ))
            ) : (
                <Text style={styles.noSchedule}>등록된 일정이 없습니다.</Text>
            )}
          </View>
        </ScrollView>

        {/* 일정 등록 모달 */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>일정 등록</Text>
                <TouchableOpacity onPress={resetForm}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.formLabel}>말 선택 *</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowHorsePicker(p => !p)}>
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

                <Text style={styles.formLabel}>일정 제목 *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="예: 예방접종, 편자 교체"
                    value={formTitle}
                    onChangeText={setFormTitle}
                />

                <Text style={styles.formLabel}>세부 내용</Text>
                <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    placeholder="세부 내용을 입력하세요"
                    value={formContent}
                    onChangeText={setFormContent}
                    multiline
                    numberOfLines={3}
                />

                <Text style={styles.formLabel}>날짜 *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD (예: 2026-05-18)"
                    value={formDate}
                    onChangeText={setFormDate}
                    keyboardType="numeric"
                />

                <Text style={styles.formLabel}>시각</Text>
                <View style={styles.timePickerRow}>
                  {/* 시간 선택 */}
                  <View style={styles.timePickerCol}>
                    <TouchableOpacity style={styles.dropdown} onPress={() => { setShowHourPicker(p => !p); setShowMinutePicker(false); }}>
                      <Text style={styles.dropdownSelected}>🕐 {formHour}시</Text>
                      <Text style={styles.dropdownArrow}>{showHourPicker ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {showHourPicker && (
                        <View style={styles.timeDropdownList}>
                          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                            {HOUR_OPTIONS.map(h => (
                                <TouchableOpacity
                                    key={h}
                                    style={[styles.dropdownItem, formHour === h && styles.dropdownItemActive]}
                                    onPress={() => { setFormHour(h); setShowHourPicker(false); }}
                                >
                                  <Text style={[styles.dropdownItemText, formHour === h && { color: '#fff' }]}>{h}시</Text>
                                </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                    )}
                  </View>

                  {/* 분 선택 */}
                  <View style={styles.timePickerCol}>
                    <TouchableOpacity style={styles.dropdown} onPress={() => { setShowMinutePicker(p => !p); setShowHourPicker(false); }}>
                      <Text style={styles.dropdownSelected}>{formMinute}분</Text>
                      <Text style={styles.dropdownArrow}>{showMinutePicker ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {showMinutePicker && (
                        <View style={styles.timeDropdownList}>
                          {MINUTE_OPTIONS.map(m => (
                              <TouchableOpacity
                                  key={m}
                                  style={[styles.dropdownItem, formMinute === m && styles.dropdownItemActive]}
                                  onPress={() => { setFormMinute(m); setShowMinutePicker(false); }}
                              >
                                <Text style={[styles.dropdownItemText, formMinute === m && { color: '#fff' }]}>{m}분</Text>
                              </TouchableOpacity>
                          ))}
                        </View>
                    )}
                  </View>
                </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#4f6ef7', paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  addButton: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  viewToggle: { flexDirection: 'row', backgroundColor: '#e8eeff', margin: 16, borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#4f6ef7' },
  toggleText: { fontWeight: '600', color: '#6b7cbe' },
  toggleTextActive: { color: '#fff' },
  calendarCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#4f6ef7', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, marginBottom: 16,
  },
  weekCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#4f6ef7', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, marginBottom: 16,
  },
  weekNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  weekNavBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8eeff', justifyContent: 'center', alignItems: 'center' },
  weekNavArrow: { fontSize: 22, color: '#4f6ef7', fontWeight: 'bold', lineHeight: 26 },
  weekRangeLabel: { fontSize: 14, fontWeight: '700', color: '#1e2d6b' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { alignItems: 'center', flex: 1 },
  weekDayLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  weekDateCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  weekDateCircleSelected: { backgroundColor: '#4f6ef7' },
  weekDateCircleToday: { borderWidth: 2, borderColor: '#f97316' },
  weekDateNum: { fontSize: 15, fontWeight: '600', color: '#1e2d6b' },
  weekDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#f97316', marginTop: 4 },
  scheduleSection: { paddingHorizontal: 16, marginTop: 10, paddingBottom: 32 },
  selectedDate: { fontSize: 15, fontWeight: '700', color: '#1e2d6b', marginBottom: 12 },
  scheduleCard: {
    position: 'relative', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 10, shadowColor: '#4f6ef7', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  scheduleTimeBar: { width: 5, backgroundColor: '#4f6ef7', borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  scheduleBody: { flex: 1, padding: 14 },
  scheduleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  scheduleTitle: { fontSize: 15, fontWeight: '700', color: '#1e2d6b', flex: 1, marginRight: 35 },
  deleteIconButton: {
    position: 'absolute', top: 6, right: 6, padding: 10,
    justifyContent: 'center', alignItems: 'center', minWidth: 44, minHeight: 44, zIndex: 999,
  },
  deleteIconText: { fontSize: 18 },
  scheduleContent: { fontSize: 13, color: '#64748b', marginBottom: 8, lineHeight: 18, marginRight: 25 },
  scheduleBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  scheduleTime: { fontSize: 12, color: '#94a3b8' },
  scheduleHorseInline: { fontSize: 12, color: '#f97316', fontWeight: '600' },
  noSchedule: { color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 20, backgroundColor: '#fff', borderRadius: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e2d6b' },
  modalClose: { fontSize: 22, color: '#94a3b8' },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1e293b', backgroundColor: '#f8faff' },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, backgroundColor: '#f8faff' },
  dropdownSelected: { fontSize: 15, color: '#1e293b' },
  dropdownPlaceholder: { fontSize: 15, color: '#94a3b8' },
  dropdownArrow: { fontSize: 12, color: '#94a3b8' },
  dropdownList: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, marginTop: 4, backgroundColor: '#fff', overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemActive: { backgroundColor: '#4f6ef7' },
  dropdownItemText: { fontSize: 14, color: '#1e293b' },
  timePickerRow: { flexDirection: 'row', gap: 12 },
  timePickerCol: { flex: 1 },
  timeDropdownList: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, marginTop: 4, backgroundColor: '#fff', overflow: 'hidden' },
  submitButton: { backgroundColor: '#4f6ef7', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});