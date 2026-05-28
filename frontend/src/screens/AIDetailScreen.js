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
                    source={{ uri: (analysisType === 'hoof' ? resultData.imageUrl : resultData.resultImageUrl) || 'https://via.placeholder.com/400' }}
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
                            ? getHoofStatusStyle(resultData.grade).color
                            : (resultData.isLameness ? '#ef4444' : '#10b981')
                    }]}>
                        {/* [요구사항 반영: 마-1, 바-15] 발굽은 4단계 상태 텍스트, 파행은 Y/N 여부 표시 */}
                        {analysisType === 'hoof'
                            ? resultData.grade
                            : (resultData.isLameness ? '파행 감지 (Y)' : '정상 보행 (N)')}
                    </Text>
                </View>

                {/* [요구사항 반영: 마-1] 발굽 분석일 경우에만 4단계 시각적 게이지바 표시 */}
                {analysisType === 'hoof' && (
                    <View style={styles.gaugeContainer}>
                        <View style={[
                            styles.gaugeFill,
                            {
                                width: getHoofStatusStyle(resultData.grade).percentage,
                                backgroundColor: getHoofStatusStyle(resultData.grade).color
                            }
                        ]} />
                    </View>
                )}
            </View>

            {/* 3. 상세 진단 결과 (이상 부위 및 설명) */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>AI 상세 분석</Text>

                {/* [요구사항 반영: 바-15] 파행 진단 시 이상 부위 반환 결과 표시 */}
                {analysisType === 'lameness' && resultData.affectedArea ? (
                    <Text style={styles.highlightText}>이상 부위: {resultData.affectedArea}</Text>
                ) : null}

                {analysisType === 'hoof' ? (
                    <>
                        <Text style={styles.description}>
                            {'발굽 등급: ' + (resultData.grade || '-')}
                        </Text>
                        {resultData.classProbabilities && (() => {
                            try {
                                const probs = typeof resultData.classProbabilities === 'string'
                                    ? JSON.parse(resultData.classProbabilities)
                                    : resultData.classProbabilities;
                                return (
                                    <>
                                        <Text style={styles.description}>{'크랙 감지 확률: ' + (probs['크랙'] !== undefined ? (probs['크랙'] * 100).toFixed(1) + '%' : '-')}</Text>
                                        <Text style={styles.description}>{'손상 감지 확률: ' + (probs['손상'] !== undefined ? (probs['손상'] * 100).toFixed(1) + '%' : '-')}</Text>
                                    </>
                                );
                            } catch(e) { return null; }
                        })()}
                        <Text style={[styles.description, {marginTop: 8, color: resultData.grade === '심각' ? '#ef4444' : resultData.grade === '중등도' ? '#f97316' : resultData.grade === '경미' ? '#facc15' : '#10b981'}]}>
                            {resultData.grade === '심각' ? '심각한 크랙 및 손상이 감지되었습니다. 즉각적인 수의사 진료가 필요합니다.'
                            : resultData.grade === '중등도' ? '중등도 손상이 감지되었습니다. 수의사 상담을 권장합니다.'
                            : resultData.grade === '경미' ? '경미한 이상이 감지되었습니다. 주의 깊게 관찰하세요.'
                            : '발굽 상태가 정상입니다. 정기적인 관리를 유지하세요.'}
                        </Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.description}>{'파행 감지: ' + (resultData.isLameness ? 'YES ⚠️' : 'NO ✅')}</Text>
                        {resultData.affectedArea ? <Text style={styles.description}>{'이상 부위: ' + resultData.affectedArea}</Text> : null}
                        {resultData.problemJoint ? <Text style={styles.description}>{'문제 관절: ' + resultData.problemJoint}</Text> : null}
                        {resultData.walkType ? <Text style={styles.description}>{'보행 유형: ' + resultData.walkType + (resultData.walkDirection ? ' / 촬영 방향: ' + resultData.walkDirection : '')}</Text> : null}
                        {resultData.confidence ? <Text style={styles.description}>{'좌우 비대칭 신뢰도: ' + (resultData.confidence * 100).toFixed(1) + '%'}</Text> : null}
                        <Text style={[styles.description, {marginTop: 8, color: resultData.isLameness ? '#ef4444' : '#10b981'}]}>
                            {resultData.isLameness
                                ? '좌우 움직임 비대칭이 감지되었습니다. 수의사 진단을 권장합니다.'
                                : '정상적인 보행 패턴이 감지되었습니다.'}
                        </Text>
                    </>
                )}
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