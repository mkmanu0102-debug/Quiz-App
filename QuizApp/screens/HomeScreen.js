import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator
} from 'react-native';
import { api } from '../api';

const difficulties = [
  { name: 'Easy', icon: '🟢', color: '#10b981' },
  { name: 'Medium', icon: '🟡', color: '#f59e0b' },
  { name: 'Hard', icon: '🔴', color: '#ef4444' },
];

export default function HomeScreen({ navigation, route }) {
  const { user, token } = route.params;
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const res = await api.getQuizzes(token);
      if (Array.isArray(res)) setQuizzes(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getQuizzesByDifficulty = (difficulty) => {
    return quizzes.filter(q => q.difficulty === difficulty);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>

      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>🎯 Quiz World</Text>
            <Text style={styles.welcome}>Welcome, {user?.name}!</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate('Leaderboard', { token })}>
          <Text style={styles.navBtnText}>🏆 Leaderboard</Text>
        </TouchableOpacity>
        <View style={{ width: 10 }} />
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate('History', { token })}>
          <Text style={styles.navBtnText}>📊 My History</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Select a Quiz by Difficulty</Text>

      {loading ? (
        <ActivityIndicator color="#4f46e5" size="large" style={{ marginTop: 30 }} />
      ) : (
        difficulties.map((diff) => {
          const diffQuizzes = getQuizzesByDifficulty(diff.name);
          return (
            <View key={diff.name} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.iconBox, { backgroundColor: diff.color + '25' }]}>
                  <Text style={styles.categoryIcon}>{diff.icon}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{diff.name} Level</Text>
                  <Text style={styles.quizCount}>{diffQuizzes.length} Quiz{diffQuizzes.length !== 1 ? 'zes' : ''} Available</Text>
                </View>
              </View>

              {diffQuizzes.length === 0 ? (
                <View style={styles.noQuizBox}>
                  <Text style={styles.noQuizText}>🔜 Coming Soon...</Text>
                </View>
              ) : (
                diffQuizzes.map((quiz) => (
                  <TouchableOpacity
                    key={quiz.id}
                    style={styles.quizItem}
                    onPress={() => navigation.navigate('Quiz', { quiz, token, user })}>
                    <View style={styles.quizLeft}>
                      <View style={styles.quizInfoContainer}>
                        <Text style={styles.quizTitle}>{quiz.title}</Text>
                        <View style={styles.quizMetaRow}>
                          <Text style={styles.quizCategory}>📁 {quiz.category}</Text>
                          <Text style={styles.quizQuestions}>📝 {quiz.total_questions} Qs</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.startBtn, { backgroundColor: diff.color }]}
                      onPress={() => navigation.navigate('Quiz', { quiz, token, user })}>
                      <Text style={styles.startBtnText}>Start →</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>
          );
        })
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { padding: 20, paddingBottom: 40 },
  topSection: { backgroundColor: '#4f46e5', borderRadius: 20, padding: 20, marginBottom: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 3 },
  welcome: { fontSize: 14, color: '#c7d2fe' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnRow: { flexDirection: 'row', marginBottom: 20 },
  navBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  navBtnText: { color: '#374151', fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: '#1e1b4b', fontSize: 18, fontWeight: '700', marginBottom: 15 },
  categorySection: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryIcon: { fontSize: 24 },
  categoryInfo: { flex: 1 },
  categoryName: { color: '#1e1b4b', fontSize: 16, fontWeight: '700' },
  quizCount: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  noQuizBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, alignItems: 'center' },
  noQuizText: { color: '#9ca3af', fontSize: 13 },
  quizItem: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quizLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  quizInfoContainer: { flex: 1 },
  quizTitle: { color: '#1e1b4b', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  quizMetaRow: { flexDirection: 'row', alignItems: 'center' },
  quizCategory: { color: '#6b7280', fontSize: 12, marginRight: 12 },
  quizQuestions: { color: '#6b7280', fontSize: 12 },
  startBtn: { borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8 },
  startBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});