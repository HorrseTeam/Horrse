import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function AIDetailScreen({ route }) {
    // 대시보드에서 전달받은 데이터
    const { resultData, analysisType } = route.params;

    // [요구사항 반영: 마-1] 발굽 상태(정상·경미·중등도·심각)에 따른 UI 색상 및 게이지 비율 매핑
    const getHoofStatusStyle = (status) => {
        switch (status) {
            case '정상': return { color: '#10b981', percentage: '25%' }; // 녹색
            case '경미': return { color: '#facc15', percentage: '50%' }; // 노란색
            case '중등도': return { color: '#f97316', percentage: '75%' }; // 주황색
            case '심각': return { color: '#ef4444', percentage: '100%' }; // 빨간색
            default: return { color: '#e2e8f0', percentage: '0%' };
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {analysisType === 'hoof' ? '🐾 AI 발굽 분석 결과' : '🦿 AI 파행 진단 결과'}
                </Text>
                {/* [요구사항 반영: 바-4] 진단 결과 카드에 진단 일시 표시 */}
                <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
            </View>

            {/* 1. 분석 사진 */}
            <View style={styles.imageWrapper}>
                <Image
                    // [요구사항 반영: 마-8, 바-16] 분석 결과 이미지 또는 키포인트 시각화 이미지 표시
                    source={{ uri: resultData.imageUrl || 'https://via.placeholder.com/400' }}
                    style={styles.resultImage}
                />
            </View>

            {/* 2. 심각도 및 주요 결과 카드 */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>진단 요약</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>종합 상태:</Text>
                    <Text style={[styles.value, {
                        color: analysisType === 'hoof'
                            ? getHoofStatusStyle(resultData.status).color
                            : (resultData.isLame === 'Y' ? '#ef4444' : '#10b981')
                    }]}>
                        {/* [요구사항 반영: 마-1, 바-15] 발굽은 4단계 상태 텍스트, 파행은 Y/N 여부 표시 */}
                        {analysisType === 'hoof'
                            ? resultData.status // '정상', '경미', '중등도', '심각' 중 하나
                            : (resultData.isLame === 'Y' ? '파행 감지 (Y)' : '정상 보행 (N)')}
                    </Text>
                </View>

                {/* [요구사항 반영: 마-1] 발굽 분석일 경우에만 4단계 시각적 게이지바 표시 */}
                {analysisType === 'hoof' && (
                    <View style={styles.gaugeContainer}>
                        <View style={[
                            styles.gaugeFill,
                            {
                                width: getHoofStatusStyle(resultData.status).percentage,
                                backgroundColor: getHoofStatusStyle(resultData.status).color
                            }
                        ]} />
                    </View>
                )}
            </View>

            {/* 3. 상세 진단 결과 (이상 부위 및 설명) */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>AI 상세 분석</Text>

                {/* [요구사항 반영: 바-15] 파행 진단 시 이상 부위 반환 결과 표시 */}
                {analysisType === 'lameness' && resultData.abnormalArea ? (
                    <Text style={styles.highlightText}>이상 부위: {resultData.abnormalArea}</Text>
                ) : null}

                {/* 공통 상세 설명 (AI가 반환한 부가 설명이 있을 경우 표시) */}
                <Text style={styles.description}>
                    {resultData.description || '상세 분석 내용이 없습니다.'}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9ff', padding: 20 },
    header: { marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1e2d6b' },
    date: { color: '#64748b', marginTop: 4 },
    imageWrapper: { borderRadius: 20, overflow: 'hidden', marginBottom: 20, elevation: 4, backgroundColor: '#fff' },
    resultImage: { width: '100%', height: width * 0.7, resizeMode: 'cover' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: '#64748b', fontSize: 14 },
    value: { fontWeight: 'bold', fontSize: 15 },
    gaugeContainer: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, marginTop: 10, marginBottom: 4 },
    gaugeFill: { height: '100%', borderRadius: 4 },
    highlightText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 },
    description: { fontSize: 14, color: '#334155', lineHeight: 22 },
});