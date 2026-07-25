import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { api } from '../api';

const categories = ['General Knowledge', 'Science', 'History', 'Computer', 'Bihar GK', 'Current Affairs'];

export default function AdminScreen({ navigation, route }) {
  const { user, token } = route.params;
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [difficulty, setDifficulty] = useState('Medium');
  const [category, setCategory] = useState('General Knowledge');
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [editQuiz, setEditQuiz] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const res = await api.getAdminQuizzes(token);
      if (Array.isArray(res)) setQuizzes(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!topic) {
      Alert.alert('Error', 'Please enter a topic!');
      return;
    }
    setLoading(true);
    try {
      const res = await api.generateQuiz(topic, numQuestions, difficulty, category, token);
      if (res.quizId) {
        Alert.alert('Success', 'Quiz generated successfully!');
        setTopic('');
        loadQuizzes();
        setActiveTab('manage');
      } else {
        Alert.alert('Error', res.message || 'Failed to generate quiz!');
      }
    } catch (err) {
      Alert.alert('Error', 'Server error!');
    }
    setLoading(false);
  };

  const handleDelete = async (quizId) => {
    Alert.alert(
      'Delete Quiz',
      'Are you sure you want to delete this quiz?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteQuiz(quizId, token);
              loadQuizzes();
              Alert.alert('Success', 'Quiz deleted!');
            } catch (err) {
              Alert.alert('Error', 'Error deleting quiz!');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (quiz) => {
    setEditQuiz(quiz);
    setEditTitle(quiz.title);
    setEditCategory(quiz.category);
    setEditDifficulty(quiz.difficulty);
  };

  const handleUpdate = async () => {
    try {
      await api.updateQuiz(editQuiz.id, editTitle, editCategory, editDifficulty, token);
      setEditQuiz(null);
      loadQuizzes();
      Alert.alert('Success', 'Quiz updated!');
    } catch (err) {
      Alert.alert('Error', 'Error updating quiz!');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 Admin Panel</Text>
        <Text style={styles.subtitle}>Welcome, {user?.name}!</Text>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'generate' && styles.tabActive]}
          onPress={() => setActiveTab('generate')}>
          <Text style={[styles.tabText, activeTab === 'generate' && styles.tabTextActive]}>Generate Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manage' && styles.tabActive]}
          onPress={() => setActiveTab('manage')}>
          <Text style={[styles.tabText, activeTab === 'manage' && styles.tabTextActive]}>Manage Quizzes</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'generate' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 AI Quiz Generator</Text>

          <Text style={styles.label}>Quiz Topic</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Indian History, Physics..."
            placeholderTextColor="#666"
            value={topic}
            onChangeText={setTopic}
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}>
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Number of Questions</Text>
          <View style={styles.row}>
            {['3', '5', '10'].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.numBtn, numQuestions === n && styles.numBtnActive]}
                onPress={() => setNumQuestions(n)}>
                <Text style={[styles.numBtnText, numQuestions === n && styles.numBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Difficulty Level</Text>
          <View style={styles.row}>
            {['Easy', 'Medium', 'Hard'].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.numBtn, difficulty === d && styles.numBtnActive]}
                onPress={() => setDifficulty(d)}>
                <Text style={[styles.numBtnText, difficulty === d && styles.numBtnTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGenerate}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>🤖 Generate Quiz</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'manage' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 All Quizzes ({quizzes.length})</Text>

          {quizzes.length === 0 ? (
            <Text style={styles.noData}>No quizzes yet! Generate one.</Text>
          ) : (
            quizzes.map(quiz => (
              <View key={quiz.id} style={styles.quizItem}>
                {editQuiz?.id === quiz.id ? (
                  <View>
                    <TextInput
                      style={styles.input}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholderTextColor="#666"
                    />
                    <TextInput
                      style={styles.input}
                      value={editCategory}
                      onChangeText={setEditCategory}
                      placeholderTextColor="#666"
                    />
                    <TextInput
                      style={styles.input}
                      value={editDifficulty}
                      onChangeText={setEditDifficulty}
                      placeholderTextColor="#666"
                    />
                    <View style={styles.row}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2ecc71', marginRight: 8 }]} onPress={handleUpdate}>
                        <Text style={styles.actionBtnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#666' }]} onPress={() => setEditQuiz(null)}>
                        <Text style={styles.actionBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.quizTitle}>{quiz.title}</Text>
                    <Text style={styles.quizMeta}>{quiz.category} • {quiz.difficulty} • {quiz.total_questions} Qs</Text>
                    <View style={styles.row}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0f3460', marginRight: 8 }]} onPress={() => handleEdit(quiz)}>
                        <Text style={styles.actionBtnText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e94560' }]} onPress={() => handleDelete(quiz.id)}>
                        <Text style={styles.actionBtnText}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1a1a2e', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 28, color: '#e94560' },
  subtitle: { fontSize: 16, color: '#a0a0b0', marginBottom: 10 },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#e94560', fontSize: 14 },
  tabRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#16213e', borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#e94560' },
  tabText: { color: '#a0a0b0', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#16213e', borderRadius: 20, padding: 20, marginBottom: 20 },
  cardTitle: { color: '#fff', fontSize: 18, marginBottom: 15 },
  label: { color: '#a0a0b0', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#0f3460', borderRadius: 10, padding: 15, color: '#fff', fontSize: 16, marginBottom: 15 },
  chip: { backgroundColor: '#0f3460', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: '#2a1a2e' },
  chipText: { color: '#a0a0b0', fontSize: 13 },
  chipTextActive: { color: '#e94560' },
  row: { flexDirection: 'row', marginBottom: 15 },
  numBtn: { flex: 1, backgroundColor: '#0f3460', borderRadius: 10, padding: 12, alignItems: 'center', marginRight: 5 },
  numBtnActive: { backgroundColor: '#2a1a2e' },
  numBtnText: { color: '#a0a0b0', fontSize: 16 },
  numBtnTextActive: { color: '#e94560' },
  button: { backgroundColor: '#e94560', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 18 },
  noData: { color: '#666', textAlign: 'center', fontSize: 14, padding: 20 },
  quizItem: { backgroundColor: '#0f3460', borderRadius: 10, padding: 15, marginBottom: 10 },
  quizTitle: { color: '#fff', fontSize: 16, marginBottom: 4 },
  quizMeta: { color: '#a0a0b0', fontSize: 12, marginBottom: 10 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14 },
});