import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import API_URL from '../config/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(''); // 기획에 따라 아이디 혹은 이메일로 사용 가능
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // 🎯 중복 로그인 요청 방지 처리용 상태

  const handleLogin = async () => {
    // 유효성 검사 (공백 제외)
    if (!email.trim() || !password.trim()) {
      Alert.alert('로그인 실패', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      // 📡 백엔드 세션/토큰 인증 API 호출
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: email.trim(),
        password: password
      });

      // 백엔드 응답에서 토큰이나 세션 상태 확인 (인증 처리 레이어)
      const token = response.data.token;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      Alert.alert('인증 성공', '로그인 되었습니다.');

      // 메인 대시보드 탭으로 화면 이동 및 네비게이션 스택 초기화 (뒤로가기 방지)
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.error('로그인 서버 통신 에러:', error);
      
      if (error.response && error.response.status === 401) {
        Alert.alert('로그인 실패', '아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        Alert.alert('서버 에러', '네트워크 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>🐴</Text>
          <Text style={styles.logoTitle}>호올스</Text>
          <Text style={styles.logoSub}>스마트한 말 관리 시스템</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>아이디</Text>
          <TextInput
            style={styles.input}
            placeholder="아이디를 입력하세요"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            editable={!loading} // 로딩 중에는 인풋 편집 차단
          />

          <Text style={styles.inputLabel}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 입력하세요"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry 
            autoCapitalize="none"
            editable={!loading} // 로딩 중에는 인풋 편집 차단
          />

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading} // 🎯 로딩 중 중복 터치 차단
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { fontSize: 64, marginBottom: 12 },
  logoTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e2d6b' },
  logoSub: { fontSize: 14, color: '#64748b', marginTop: 6 },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 14 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8faff',
  },
  loginButton: {
    backgroundColor: '#4f6ef7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 52, // 로딩 인디케이터 전환 시 높이 튀는 현상 방지
    justifyContent: 'center'
  },
  loginButtonDisabled: {
    backgroundColor: '#93a5ff', // 로딩 시 버튼 비활성화 시각화
  },
  loginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});