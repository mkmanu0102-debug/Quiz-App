import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator
} from 'react-native';
import { api } from '../api';

export default function QuizScreen({ navigation, route }) {
  const { quiz, token, user } = route.params;
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQuestions(); }, []);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (timeLeft === 0) handleNext();
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, loading, questions]);

  const loadQuestions = async () => {
    try {
      const res = await api.getQuestions(quiz.id, token);
      if (Array.isArray(res)) setQuestions(res);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = () => {
    const newAnswers = [...answers, { selected, correct: questions[current].correct_answer }];
    if (current + 1 >= questions.length) {
      const score = newAnswers.filter(a => a.selected === a.correct).length;
      const percentage = Math.round((score / questions.length) * 100);
      api.submitResult(quiz.id, score, questions.length, percentage, token);
      navigation.navigate('Result', { score, total: questions.length, percentage, quiz, user, token });
    } else {
      setAnswers(newAnswers);
      setCurrent(c => c + 1);
      setSelected(null);
      setTimeLeft(30);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
      setSelected(answers[current - 1]?.selected ?? null);
      setTimeLeft(30);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#4f46e5" size="large" />
      <Text style={styles.loadingText}>Loading Questions...</Text>
    </View>
  );

  if (questions.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.loadingText}>No questions found!</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: '#4f46e5', marginTop: 20 }}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const q = questions[current];
  const timerPercent = (timeLeft / 30) * 100;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.quizTitle}>{quiz.title}</Text>
        <View style={[styles.timer, { backgroundColor: timeLeft <= 10 ? '#fee2e2' : '#ede9fe' }]}>
          <Text style={[styles.timerText, { color: timeLeft <= 10 ? '#dc2626' : '#4f46e5' }]}>⏱ {timeLeft}s</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressText}>Question {current + 1} of {questions.length}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionNum}>Q{current + 1}</Text>
        <Text style={styles.question}>{q.question}</Text>
      </View>

      {q.options.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.option,
            selected === idx && idx === q.correct_answer && styles.correct,
            selected === idx && idx !== q.correct_answer && styles.wrong,
            selected !== null && idx === q.correct_answer && styles.correct,
          ]}
          onPress={() => handleSelect(idx)}>
          <View style={[styles.optionLetter, {
            backgroundColor: selected !== null && idx === q.correct_answer ? '#d1fae5' :
              selected === idx && idx !== q.correct_answer ? '#fee2e2' : '#ede9fe'
          }]}>
            <Text style={styles.optionLetterText}>{String.fromCharCode(65 + idx)}</Text>
          </View>
          <Text style={styles.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
          <Text style={styles.prevBtnText}>← Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>{current + 1 === questions.length ? '🏁 Finish' : 'Next →'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f4ff', padding: 20 },
  center: { flex: 1, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6b7280', fontSize: 16, marginTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 15 },
  quizTitle: { color: '#1e1b4b', fontSize: 16, flex: 1 },
  timer: { borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8 },
  timerText: { fontSize: 15 },
  progressSection: { marginBottom: 20 },
  progressText: { color: '#6b7280', fontSize: 13, marginBottom: 6 },
  progressBar: { backgroundColor: '#e5e7eb', borderRadius: 10, height: 6 },
  progressFill: { backgroundColor: '#4f46e5', borderRadius: 10, height: 6 },
  questionCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20 },
  questionNum: { color: '#4f46e5', fontSize: 13, marginBottom: 8 },
  question: { color: '#1e1b4b', fontSize: 17, lineHeight: 26 },
  option: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  correct: { backgroundColor: '#f0fdf4' },
  wrong: { backgroundColor: '#fef2f2' },
  optionLetter: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionLetterText: { color: '#4f46e5', fontSize: 14 },
  optionText: { color: '#374151', fontSize: 15, flex: 1 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  prevBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 15, alignItems: 'center', marginRight: 10 },
  prevBtnText: { color: '#374151', fontSize: 15 },
  nextBtn: { flex: 1, backgroundColor: '#4f46e5', borderRadius: 10, padding: 15, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 15 },
});