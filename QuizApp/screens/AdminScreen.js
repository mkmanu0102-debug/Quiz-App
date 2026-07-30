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

  // Manual Quiz States
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('General Knowledge');
  const [customDifficulty, setCustomDifficulty] = useState('Medium');
  const [customQuestions, setCustomQuestions] = useState([
    { question: '', options: ['', '', '', ''], correct_answer: 0 }
  ]);

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
    const num = parseInt(numQuestions, 10);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Please enter a valid number of questions!');
      return;
    }
    if (num > 25) {
      Alert.alert('Limit Exceeded', 'For AI generation, please limit to maximum 25 questions to avoid server timeout.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.generateQuiz(topic, num.toString(), difficulty, category, token);
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

  // Custom Question Handlers
  const updateQuestionText = (index, text) => {
    const updated = [...customQuestions];
    updated[index].question = text;
    setCustomQuestions(updated);
  };

  const updateOptionText = (qIndex, oIndex, text) => {
    const updated = [...customQuestions];
    updated[qIndex].options[oIndex] = text;
    setCustomQuestions(updated);
  };

  const setCorrectAnswer = (qIndex, oIndex) => {
    const updated = [...customQuestions];
    updated[qIndex].correct_answer = oIndex;
    setCustomQuestions(updated);
  };

  const addQuestion = () => {
    setCustomQuestions([...customQuestions, { question: '', options: ['', '', '', ''], correct_answer: 0 }]);
  };

  const removeQuestion = (index) => {
    if (customQuestions.length > 1) {
      const updated = [...customQuestions];
      updated.splice(index, 1);
      setCustomQuestions(updated);
    }
  };

  const handleCreateCustomQuiz = async () => {
    if (!customTitle) {
      Alert.alert('Error', 'Please enter a quiz title/topic!');
      return;
    }
    // Validation
    for (let i = 0; i < customQuestions.length; i++) {
      const q = customQuestions[i];
      if (!q.question) {
        Alert.alert('Error', `Please fill question text for Question #${i + 1}`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j]) {
          Alert.alert('Error', `Please fill Option ${String.fromCharCode(65 + j)} for Question #${i + 1}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const res = await api.createQuiz(customTitle, customCategory, customDifficulty, customQuestions, token);
      if (res.quizId) {
        Alert.alert('Success', 'Custom quiz created successfully!');
        setCustomTitle('');
        setCustomQuestions([{ question: '', options: ['', '', '', ''], correct_answer: 0 }]);
        loadQuizzes();
        setActiveTab('manage');
      } else {
        Alert.alert('Error', res.message || 'Failed to create quiz!');
      }
    } catch (err) {
      Alert.alert('Error', 'Server error!');
    }
    setLoading(false);
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
          <Text style={[styles.tabText, activeTab === 'generate' && styles.tabTextActive]}>AI Generate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.tabActive]}
          onPress={() => setActiveTab('create')}>
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>Create Custom</Text>
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
          <TextInput
            style={[styles.input, { marginTop: -5, marginBottom: 15 }]}
            placeholder="Or enter custom number (e.g. 15, Max 25)"
            placeholderTextColor="#666"
            value={numQuestions}
            onChangeText={(val) => {
              const clean = val.replace(/[^0-9]/g, '');
              setNumQuestions(clean);
            }}
            keyboardType="numeric"
          />

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

      {activeTab === 'create' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✍️ Custom Quiz Creator</Text>

          <Text style={styles.label}>Quiz Title / Topic</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Modern Physics, World War II..."
            placeholderTextColor="#666"
            value={customTitle}
            onChangeText={setCustomTitle}
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, customCategory === cat && styles.chipActive]}
                onPress={() => setCustomCategory(cat)}>
                <Text style={[styles.chipText, customCategory === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Difficulty Level</Text>
          <View style={styles.row}>
            {['Easy', 'Medium', 'Hard'].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.numBtn, customDifficulty === d && styles.numBtnActive]}
                onPress={() => setCustomDifficulty(d)}>
                <Text style={[styles.numBtnText, customDifficulty === d && styles.numBtnTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Questions ({customQuestions.length})</Text>

          {customQuestions.map((q, qIdx) => (
            <View key={qIdx} style={styles.questionFormBox}>
              <View style={styles.questionHeaderRow}>
                <Text style={styles.questionLabel}>Question #{qIdx + 1}</Text>
                {customQuestions.length > 1 && (
                  <TouchableOpacity onPress={() => removeQuestion(qIdx)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>🗑️ Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={[styles.input, { marginBottom: 10 }]}
                placeholder="Enter question text"
                placeholderTextColor="#666"
                value={q.question}
                onChangeText={(text) => updateQuestionText(qIdx, text)}
                multiline
              />

              <Text style={[styles.label, { fontSize: 13, marginBottom: 5 }]}>Options</Text>
              {q.options.map((opt, oIdx) => (
                <View key={oIdx} style={styles.optionInputRow}>
                  <View style={[styles.optionIndicator, q.correct_answer === oIdx && styles.optionIndicatorActive]}>
                    <Text style={[styles.optionIndicatorText, q.correct_answer === oIdx && styles.optionIndicatorTextActive]}>
                      {String.fromCharCode(65 + oIdx)}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.optionInput}
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                    placeholderTextColor="#666"
                    value={opt}
                    onChangeText={(text) => updateOptionText(qIdx, oIdx, text)}
                  />
                  <TouchableOpacity 
                    style={[styles.correctSelectBtn, q.correct_answer === oIdx && styles.correctSelectBtnActive]}
                    onPress={() => setCorrectAnswer(qIdx, oIdx)}>
                    <Text style={[styles.correctSelectBtnText, q.correct_answer === oIdx && styles.correctSelectBtnTextActive]}>
                      {q.correct_answer === oIdx ? 'Correct ✓' : 'Mark'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}

          <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
            <Text style={styles.addQuestionBtnText}>➕ Add Another Question</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateCustomQuiz}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>💾 Create Custom Quiz</Text>
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
  tabText: { color: '#a0a0b0', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#16213e', borderRadius: 20, padding: 20, marginBottom: 20 },
  cardTitle: { color: '#fff', fontSize: 18, marginBottom: 15 },
  label: { color: '#a0a0b0', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#0f3460', borderRadius: 10, padding: 15, color: '#fff', fontSize: 16, marginBottom: 15 },
  chip: { backgroundColor: '#0f3460', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: '#e94560' },
  chipText: { color: '#a0a0b0', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', marginBottom: 15 },
  numBtn: { flex: 1, backgroundColor: '#0f3460', borderRadius: 10, padding: 12, alignItems: 'center', marginRight: 5 },
  numBtnActive: { backgroundColor: '#e94560' },
  numBtnText: { color: '#a0a0b0', fontSize: 16 },
  numBtnTextActive: { color: '#fff' },
  button: { backgroundColor: '#e94560', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 18 },
  noData: { color: '#666', textAlign: 'center', fontSize: 14, padding: 20 },
  quizItem: { backgroundColor: '#0f3460', borderRadius: 10, padding: 15, marginBottom: 10 },
  quizTitle: { color: '#fff', fontSize: 16, marginBottom: 4 },
  quizMeta: { color: '#a0a0b0', fontSize: 12, marginBottom: 10 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14 },
  
  // Custom manual quiz styles
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 20 },
  sectionHeader: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 15 },
  questionFormBox: { backgroundColor: '#0f3460', borderRadius: 12, padding: 12, marginBottom: 15 },
  questionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  questionLabel: { color: '#e94560', fontSize: 14, fontWeight: '700' },
  removeBtn: { padding: 4 },
  removeBtnText: { color: '#e94560', fontSize: 12 },
  optionInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  optionIndicator: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  optionIndicatorActive: { backgroundColor: '#2ecc71' },
  optionIndicatorText: { color: '#a0a0b0', fontSize: 12, fontWeight: '700' },
  optionIndicatorTextActive: { color: '#fff' },
  optionInput: { flex: 1, backgroundColor: '#16213e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: '#fff', fontSize: 14 },
  correctSelectBtn: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#16213e', borderRadius: 8 },
  correctSelectBtnActive: { backgroundColor: '#2ecc71' },
  correctSelectBtnText: { color: '#a0a0b0', fontSize: 12, fontWeight: '700' },
  correctSelectBtnTextActive: { color: '#fff' },
  addQuestionBtn: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#e94560', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 20 },
  addQuestionBtnText: { color: '#e94560', fontSize: 14, fontWeight: '700' },
});