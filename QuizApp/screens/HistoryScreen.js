import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../api';

export default function HistoryScreen({ navigation, route }) {
  const { token } = route.params;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getHistory(token);
      if (Array.isArray(res)) setHistory(res);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getScoreStyle = (percentage) => {
    if (percentage >= 80) return { color: '#10b981', bg: '#d1fae5' };
    if (percentage >= 60) return { color: '#f59e0b', bg: '#fef3c7' };
    return { color: '#ef4444', bg: '#fee2e2' };
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.logo}>📊</Text>
        <Text style={styles.title}>Quiz History</Text>
        <Text style={styles.subtitle}>Your Past Attempts</Text>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color="#4f46e5" size="large" style={{ marginTop: 30 }} />
      ) : history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No attempts yet!</Text>
          <Text style={styles.emptySubText}>Start playing to see your history.</Text>
        </View>
      ) : (
        history.map((item, index) => {
          const scoreStyle = getScoreStyle(item.percentage);
          return (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <Text style={styles.quizTitle}>{item.title}</Text>
                <Text style={styles.quizCategory}>{item.category}</Text>
                <Text style={styles.quizDate}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={[styles.scoreBox, { backgroundColor: scoreStyle.bg }]}>
                <Text style={[styles.percentage, { color: scoreStyle.color }]}>{item.percentage}%</Text>
                <Text style={[styles.scoreText, { color: scoreStyle.color }]}>{item.score}/{item.total}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f4ff', padding: 20 },
  topSection: { backgroundColor: '#4f46e5', padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginHorizontal: -20, marginTop: -20, marginBottom: 20 },
  logo: { fontSize: 50, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 15, color: '#c7d2fe' },
  back: { marginBottom: 15 },
  backText: { color: '#4f46e5', fontSize: 15, fontWeight: '700' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 15, padding: 30, alignItems: 'center' },
  emptyText: { color: '#374151', fontSize: 18, fontWeight: '700' },
  emptySubText: { color: '#9ca3af', fontSize: 14, marginTop: 5 },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyLeft: { flex: 1 },
  quizTitle: { color: '#1e1b4b', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  quizCategory: { color: '#6b7280', fontSize: 12, marginBottom: 3 },
  quizDate: { color: '#9ca3af', fontSize: 11 },
  scoreBox: { borderRadius: 12, padding: 12, alignItems: 'center', minWidth: 70 },
  percentage: { fontSize: 22, fontWeight: '700' },
  scoreText: { fontSize: 12, marginTop: 2 },
});