import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { api } from '../api';

export default function LoginScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      setError('Please enter email/phone and password!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.login(emailOrPhone.trim(), password);
      if (res.token) {
        if (res.user.role === 'admin') {
          navigation.navigate('Admin', { user: res.user, token: res.token });
        } else {
          navigation.navigate('Home', { user: res.user, token: res.token });
        }
      } else {
        setError(res.message || 'Login failed!');
      }
    } catch (err) {
      setError('Server error! Please try again.');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.logo}>🎯</Text>
        <Text style={styles.title}>Quiz World</Text>
        <Text style={styles.subtitle}>Test Your Knowledge</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome Back!</Text>

        {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text></View> : null}

        <Text style={styles.label}>Email or Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email or 10-digit number"
          placeholderTextColor="#aaa"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          autoCapitalize="none"
          keyboardType="default"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotLink}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>Don't have an account? <Text style={styles.registerLink}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f4ff' },
  topSection: { backgroundColor: '#4f46e5', padding: 50, alignItems: 'center' },
  logo: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 36, color: '#fff', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#c7d2fe' },
  card: { backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 25, marginTop: 30 },
  cardTitle: { fontSize: 22, color: '#1e1b4b', marginBottom: 20 },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, marginBottom: 15 },
  error: { color: '#dc2626', fontSize: 13 },
  label: { color: '#374151', fontSize: 14, marginBottom: 6 },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, color: '#111', fontSize: 15, marginBottom: 16 },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 16 },
  registerBtn: { marginTop: 20, alignItems: 'center' },
  registerText: { color: '#6b7280', fontSize: 14 },
  registerLink: { color: '#4f46e5' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16, marginTop: -8 },
  forgotLink: { color: '#4f46e5', fontSize: 13, fontWeight: '600' },
});