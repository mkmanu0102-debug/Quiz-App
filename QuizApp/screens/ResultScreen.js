import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ResultScreen({ navigation, route }) {
  const { score, total, percentage, quiz, user, token } = route.params;

  const getGrade = () => {
    if (percentage >= 80) return { emoji: '🏆', title: 'Excellent!', color: '#10b981', bg: '#d1fae5' };
    if (percentage >= 60) return { emoji: '👍', title: 'Good Job!', color: '#f59e0b', bg: '#fef3c7' };
    if (percentage >= 40) return { emoji: '😐', title: 'Average', color: '#6366f1', bg: '#ede9fe' };
    return { emoji: '😢', title: 'Try Again!', color: '#ef4444', bg: '#fee2e2' };
  };

  const grade = getGrade();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.topSection, { backgroundColor: grade.color }]}>
        <Text style={styles.emoji}>{grade.emoji}</Text>
        <Text style={styles.resultTitle}>{grade.title}</Text>
        <Text style={styles.quizName}>{quiz.title}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#d1fae5' }]}>
            <Text style={[styles.statNum, { color: '#10b981' }]}>{score}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.statNum, { color: '#ef4444' }]}>{total - score}</Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: grade.bg }]}>
            <Text style={[styles.statNum, { color: grade.color }]}>{percentage}%</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: grade.color }]} />
        </View>
        <Text style={styles.progressLabel}>{percentage}% Score</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: grade.color }]}
          onPress={() => navigation.navigate('Home', { user, token })}>
          <Text style={styles.buttonText}>🏠 Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => navigation.navigate('Leaderboard', { token })}>
          <Text style={styles.outlineBtnText}>🏆 View Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f4ff' },
  topSection: { padding: 50, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  emoji: { fontSize: 70, marginBottom: 10 },
  resultTitle: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 5 },
  quizName: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  card: { backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 25 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox: { flex: 1, borderRadius: 12, padding: 15, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  statLabel: { color: '#6b7280', fontSize: 12 },
  progressBar: { backgroundColor: '#e5e7eb', borderRadius: 10, height: 10, marginBottom: 8 },
  progressFill: { borderRadius: 10, height: 10 },
  progressLabel: { color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 25 },
  button: { borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: { borderRadius: 12, padding: 15, alignItems: 'center', backgroundColor: '#ede9fe' },
  outlineBtnText: { color: '#4f46e5', fontSize: 16, fontWeight: '700' },
});