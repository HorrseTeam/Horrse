import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import API_URL from '../config/api';

export default function DashboardScreen() {
  const [diagnoses, setDiagnoses] = useState([]);

  useEffect(() => {
     // Fetch the real PostgreSQL database results
     axios.get(`${API_URL}/diagnosis/1`)
       .then(res => setDiagnoses(res.data))
       .catch(err => console.log('Dashboard DB Error:', err));
  }, []);

  // For chart data we could show lameness risk over time or hoof grades.
  // Using dummy trend line for general health for now unless we derive scores.
  const chartData = {
    labels: ['1주차', '2주차', '3주차', '4주차', '5주차', '6주차'],
    datasets: [{ data: [37.5, 37.8, 38.0, 37.6, 37.9, 38.2], strokeWidth: 2 }],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>건강 대시보드 (체온 추이)</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 32}
          height={220}
          yAxisSuffix="°C"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '6', strokeWidth: '2', stroke: '#ffa726' },
          }}
          bezier style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>

      <Text style={styles.title}>최근 AI 분석 이력 (DB 연동)</Text>
      {diagnoses.length > 0 ? (
          diagnoses.map((diag, idx) => (
             <View key={idx} style={styles.recordCard}>
                <Text style={styles.recordTitle}>파행 진단: {diag.isLameness ? '이상 감지(Y)' : '정상(N)'}</Text>
                <Text>보행 모드: {diag.walkType}</Text>
                <Text style={styles.dateText}>{new Date(diag.createdAt).toLocaleString()}</Text>
             </View>
          ))
      ) : (
          <Text style={{marginLeft: 10, color: '#888'}}>조회된 훈련/진단 데이터가 없습니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginVertical: 12, color: '#333' },
  chartContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  recordCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#f44336', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  recordTitle: { fontSize: 16, fontWeight: '600', color: '#2b2b2b', marginBottom: 4 },
  dateText: { fontSize: 12, color: '#888', marginTop: 8 }
});

