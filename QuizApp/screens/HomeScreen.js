import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { api } from '../api';

const categories = [
  { name: 'General Knowledge', icon: '🌍', color: '#FF6B6B' },
  { name: 'Science', icon: '🔬', color: '#4ECDC4' },
  { name: 'History', icon: '📜', color: '#45B7D1' },
  { name: 'Computer', icon: '💻', color: '#96CEB4' },
  { name: 'Bihar GK', icon: '🗺️', color: '#f59e0b' },
  { name: 'Current Affairs', icon: '📰', color: '#DDA0DD' },
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

  const handleDifficultyPress = (quizzesList, categoryName, difficultyLevel) => {
    if (quizzesList.length === 0) return;
    if (quizzesList.length === 1) {
      navigation.navigate('Quiz', { quiz: quizzesList[0], token, user });
    } else {
      // Show native dialog to select from multiple quizzes of the same difficulty
      Alert.alert(
        `${categoryName} - ${difficultyLevel}`,
        'Select a quiz to start:',
        quizzesList.map((quiz, idx) => ({
          text: `Quiz #${idx + 1} (${quiz.total_questions} Qs)`,
          onPress: () => navigation.navigate('Quiz', { quiz, token, user })
        })).concat([{ text: 'Cancel', style: 'cancel' }])
      );
    }
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

      <Text style={styles.sectionTitle}>Choose a Subject</Text>

      {loading ? (
        <ActivityIndicator color="#4f46e5" size="large" style={{ marginTop: 30 }} />
      ) : (
        categories.map((cat) => {
          const catQuizzes = quizzes.filter(q => q.category === cat.name);
          const easyQuizzes = catQuizzes.filter(q => q.difficulty === 'Easy');
          const mediumQuizzes = catQuizzes.filter(q => q.difficulty === 'Medium');
          const hardQuizzes = catQuizzes.filter(q => q.difficulty === 'Hard');

          if (catQuizzes.length === 0) return null;

          return (
            <View key={cat.name} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.iconBox, { backgroundColor: cat.color + '25' }]}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.quizCount}>
                    {catQuizzes.length} Quiz{catQuizzes.length !== 1 ? 'zes' : ''} Available
                  </Text>
                </View>
              </View>

              <View style={styles.difficultyRow}>
                {/* Easy Button */}
                {easyQuizzes.length > 0 && (
                  <TouchableOpacity
                    style={[styles.difficultyBtn, styles.easyActive]}
                    onPress={() => handleDifficultyPress(easyQuizzes, cat.name, 'Easy')}>
                    <Text style={[styles.diffBtnText, styles.textEasy]}>
                      🟢 Easy Level {easyQuizzes.length > 1 ? `(${easyQuizzes.length} Quizzes)` : ''}
                    </Text>
                    <Text style={styles.arrowText}>Play →</Text>
                  </TouchableOpacity>
                )}

                {/* Medium Button */}
                {mediumQuizzes.length > 0 && (
                  <TouchableOpacity
                    style={[styles.difficultyBtn, styles.mediumActive]}
                    onPress={() => handleDifficultyPress(mediumQuizzes, cat.name, 'Medium')}>
                    <Text style={[styles.diffBtnText, styles.textMedium]}>
                      🟡 Medium Level {mediumQuizzes.length > 1 ? `(${mediumQuizzes.length} Quizzes)` : ''}
                    </Text>
                    <Text style={styles.arrowText}>Play →</Text>
                  </TouchableOpacity>
                )}

                {/* Hard Button */}
                {hardQuizzes.length > 0 && (
                  <TouchableOpacity
                    style={[styles.difficultyBtn, styles.hardActive]}
                    onPress={() => handleDifficultyPress(hardQuizzes, cat.name, 'Hard')}>
                    <Text style={[styles.diffBtnText, styles.textHard]}>
                      🔴 Hard Level {hardQuizzes.length > 1 ? `(${hardQuizzes.length} Quizzes)` : ''}
                    </Text>
                    <Text style={styles.arrowText}>Play →</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  
  // Difficulty row section styling
  difficultyRow: { marginTop: 10 },
  difficultyBtn: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 8,
    borderWidth: 1,
  },
  diffInactive: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  easyActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  mediumActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  hardActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  diffBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  textInactive: {
    color: '#9ca3af',
  },
  textEasy: {
    color: '#047857',
  },
  textMedium: {
    color: '#b45309',
  },
  textHard: {
    color: '#b91c1c',
  },
  arrowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
});