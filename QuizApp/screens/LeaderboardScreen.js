import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../api';

export default function LeaderboardScreen({ navigation, route }) {
  const { token } = route.params;
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await api.getLeaderboard(token);
      if (Array.isArray(res)) setLeaderboard(res);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getMedal = (index) => {
    if (index === 0) return { emoji: '🥇', color: '#f59e0b', bg: '#fef3c7' };
    if (index === 1) return { emoji: '🥈', color: '#6b7280', bg: '#f3f4f6' };
    if (index === 2) return { emoji: '🥉', color: '#b45309', bg: '#fef3c7' };
    return { emoji: `#${index + 1}`, color: '#4f46e5', bg: '#ede9fe' };
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.logo}>🏆</Text>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top Players</Text>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color="#4f46e5" size="large" style={{ marginTop: 30 }} />
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No results yet!</Text>
          <Text style={styles.emptySubText}>Be the first to play!</Text>
        </View>
      ) : (
        leaderboard.map((player, index) => {
          const medal = getMedal(index);
          return (
            <View key={index} style={styles.playerCard}>
              <View style={[styles.medalBox, { backgroundColor: medal.bg }]}>
                <Text style={styles.medalText}>{medal.emoji}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerAttempts}>{player.attempts} attempts</Text>
              </View>
              <Text style={[styles.playerScore, { color: medal.color }]}>{player.best_score}%</Text>
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
  playerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  medalBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  medalText: { fontSize: 20 },
  playerInfo: { flex: 1 },
  playerName: { color: '#1e1b4b', fontSize: 16, fontWeight: '700' },
  playerAttempts: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  playerScore: { fontSize: 22, fontWeight: '700' },
});