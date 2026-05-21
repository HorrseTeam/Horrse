import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Modal, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import axios from 'axios';
import API_URL from '../config/api';

export default function SettingsScreen({ navigation }) {
  // 모달 제어 및 입력 폼 상태 관리
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); // 중복 요청 인터락용

  // 🔒 비밀번호 변경 처리 비동기 핸들러
  const handleChangePassword = async () => {
    // 1. 공백 유효성 체크
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("알림", "모든 항목을 입력해주세요.");
      return;
    }
    // 2. 새 비밀번호 일치 체크
    if (newPassword !== confirmPassword) {
      Alert.alert("오류", "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    // 3. 최소 글자수 보안 정책 체크 (예시: 4자 이상)
    if (newPassword.length < 4) {
      Alert.alert("보안 오류", "새 비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      // 📡 백엔드 비밀번호 변경 API 호출
      const payload = {
        currentPassword: currentPassword,
        newPassword: newPassword
      };
      
      await axios.put(`${API_URL}/api/user/password`, payload);
      
      Alert.alert("성공", "비밀번호가 안전하게 변경되었습니다.");
      resetPasswordForm();
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      if (error.response && error.response.status === 400) {
        Alert.alert("변경 실패", "현재 비밀번호가 올바르지 않습니다.");
      } else {
        Alert.alert("서버 에러", "네트워크 통신 중 문제가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(false);
  };

  // 🚪 로그아웃 처리 핸들러
  const handleLogout = () => {
    Alert.alert(
      "로그아웃",
      "로그아웃 하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          style: "destructive",
          onPress: async () => {
            try {
              // 필요 시 서버에 로그아웃 상태 알림 전송 (예: 토큰 블랙리스트 추가 등)
              // await axios.post(`${API_URL}/api/logout`);
            } catch (e) {
              console.log("서버 세션 만료 생략 또는 처리 지연:", e);
            } finally {
              // 🎯 여기에 토큰 저장소(AsyncStorage 또는 SecureStore)의 캐시를 클리어하는 코드가 들어갑니다.
              // await AsyncStorage.removeItem('userToken');
              
              const rootNavigation = navigation.getParent() || navigation;
              rootNavigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 상단 관리자 프로필 배너 */}
      <View style={styles.profileBanner}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
        <Text style={styles.profileName}>시스템 관리자</Text>
      </View>

      <ScrollView style={styles.menuContainer}>
        <Text style={styles.sectionHeader}>계정 및 보안</Text>
        
        {/* 비밀번호 변경 버튼 메뉴 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => setShowPasswordModal(true)} activeOpacity={0.7}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🔒</Text>
            <View>
              <Text style={styles.menuTitle}>비밀번호 변경</Text>
              <Text style={styles.menuSub}>비밀번호를 새롭게 갱신합니다</Text>
            </View>
          </View>
          <Text style={styles.arrow}>〉</Text>
        </TouchableOpacity>

        {/* 로그아웃 버튼 메뉴 */}
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🚪</Text>
            <View>
              <Text style={styles.menuTitle}>로그아웃</Text>
              <Text style={styles.menuSub}>계정 세션을 종료하고 나갑니다</Text>
            </View>
          </View>
          <Text style={styles.arrow}>〉</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>정보</Text>
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>📞</Text>
            <Text style={styles.menuTitle}>고객 지원</Text>
          </View>
          <Text style={styles.arrow}>〉</Text>
        </View>
      </ScrollView>

      {/* 하단 카피라이트 */}
      <Text style={styles.copyright}>Horse Health Management System © 2026</Text>

      {/* 비밀번호 변경 팝업 모달 */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>비밀번호 변경</Text>
              <TouchableOpacity onPress={resetPasswordForm} disabled={loading}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>현재 비밀번호</Text>
              <TextInput 
                style={styles.input} 
                secureTextEntry 
                placeholder="현재 사용 중인 비밀번호"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                editable={!loading}
              />

              <Text style={styles.formLabel}>새 비밀번호</Text>
              <TextInput 
                style={styles.input} 
                secureTextEntry 
                placeholder="변경할 새 비밀번호 입력"
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
              />

              <Text style={styles.formLabel}>새 비밀번호 확인</Text>
              <TextInput 
                style={styles.input} 
                secureTextEntry 
                placeholder="새 비밀번호 다시 입력"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
            </ScrollView>

            <TouchableOpacity 
              style={[styles.submitButton, loading && { backgroundColor: '#93a5ff' }]} 
              onPress={handleChangePassword}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>변경 완료</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  profileBanner: { 
    backgroundColor: '#4f6ef7', 
    alignItems: 'center', 
    paddingTop: 40, 
    paddingBottom: 30 
  },
  avatarCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 12
  },
  avatarIcon: { fontSize: 40, color: '#fff' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  
  menuContainer: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#64748b', marginTop: 24, marginBottom: 10, paddingLeft: 4 },
  
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 10,
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIcon: { fontSize: 22 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  menuSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  arrow: { fontSize: 14, color: '#cbd5e1', fontWeight: 'bold' },
  
  copyright: { textAlign: 'center', fontSize: 12, color: '#94a3b8', marginBottom: 20, marginTop: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e2d6b' },
  modalClose: { fontSize: 22, color: '#94a3b8', paddingHorizontal: 4 },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b', backgroundColor: '#f8faff' },
  submitButton: { backgroundColor: '#4f6ef7', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 24, minHeight: 48, justifyContent: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});