import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';

const SETTINGS_SECTIONS = [
  {
    title: '계정',
    items: [
      { icon: '👤', label: '프로필 설정', desc: '이름, 사진 등', disabled: true },
      { icon: '🔔', label: '알림 설정', desc: '일정 푸시 알림', disabled: true },
    ],
  },
  {
    title: '앱',
    items: [
      { icon: '🌐', label: '언어 설정', desc: '한국어', disabled: true },
      { icon: '🎨', label: '테마', desc: '라이트 모드', disabled: true },
      { icon: '📡', label: '서버 설정', desc: 'API 주소 변경', disabled: true },
    ],
  },
  {
    title: '정보',
    items: [
      { icon: '📋', label: '버전 정보', desc: 'v1.0.0', disabled: true },
      { icon: '🔒', label: '개인정보 처리방침', desc: '', disabled: true },
      { icon: '📞', label: '고객 지원', desc: '', disabled: true },
    ],
  },
];

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* 헤더 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.profileName}>관리자</Text>
        <Text style={styles.profileRole}>말 건강 관리 시스템</Text>
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>준비 중입니다</Text>
        </View>
      </View>

      {/* 설정 섹션들 */}
      {SETTINGS_SECTIONS.map((section, si) => (
        <View key={si} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, ii) => (
              <View key={ii}>
                <TouchableOpacity
                  style={styles.settingsItem}
                  activeOpacity={0.6}
                  disabled={item.disabled}
                >
                  <View style={styles.settingsIconCircle}>
                    <Text style={styles.settingsIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.settingsText}>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                    {item.desc ? <Text style={styles.settingsDesc}>{item.desc}</Text> : null}
                  </View>
                  <Text style={styles.settingsChevron}>›</Text>
                </TouchableOpacity>
                {ii < section.items.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.footer}>Horrse Health Management System © 2025</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  profileCard: {
    backgroundColor: '#4f6ef7',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 38 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileRole: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  profileBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  profileBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7cbe', marginBottom: 8, marginLeft: 4 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#4f6ef7',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eef1ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsIcon: { fontSize: 18 },
  settingsText: { flex: 1 },
  settingsLabel: { fontSize: 15, fontWeight: '600', color: '#1e2d6b' },
  settingsDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  settingsChevron: { fontSize: 22, color: '#d1d9f7', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 68 },
  footer: { textAlign: 'center', color: '#c0c8e8', fontSize: 12, marginVertical: 20 },
});
