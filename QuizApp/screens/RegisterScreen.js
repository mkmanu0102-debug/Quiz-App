import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { api } from '../api';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !emailOrPhone || !password || !confirmPassword) {
      setError('Please fill all fields!');
      return;
    }

    const trimmedInput = emailOrPhone.trim();
    const isEmail = trimmedInput.includes('@');
    if (isEmail) {
      if (!trimmedInput.includes('.')) {
        setError('Please enter a valid email address!');
        return;
      }
    } else {
      const isNumeric = /^\d+$/.test(trimmedInput);
      if (!isNumeric || trimmedInput.length !== 10) {
        setError('Please enter a valid email or 10-digit phone number!');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters!');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.register(name, trimmedInput, password);
      if (res.message && res.message.includes('OTP sent')) {
        navigation.navigate('Otp', { emailOrPhone: trimmedInput });
      } else {
        setError(res.message || 'Registration failed!');
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
        <Text style={styles.subtitle}>Create Your Account</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Register</Text>

        {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text></View> : null}

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email or Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email or 10-digit phone number"
          placeholderTextColor="#aaa"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          autoCapitalize="none"
          keyboardType="default"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Min 6 characters"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter your password"
          placeholderTextColor="#aaa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Register & Get OTP</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLink}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f4ff' },
  topSection: { backgroundColor: '#4f46e5', padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  logo: { fontSize: 50, marginBottom: 8 },
  title: { fontSize: 32, color: '#fff', marginBottom: 5 },
  subtitle: { fontSize: 15, color: '#c7d2fe' },
  card: { backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 25, marginTop: 25 },
  cardTitle: { fontSize: 22, color: '#1e1b4b', marginBottom: 20 },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, marginBottom: 15 },
  error: { color: '#dc2626', fontSize: 13 },
  label: { color: '#374151', fontSize: 14, marginBottom: 6 },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, color: '#111', fontSize: 15, marginBottom: 16 },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 16 },
  loginBtn: { marginTop: 20, alignItems: 'center' },
  loginText: { color: '#6b7280', fontSize: 14 },
  loginLink: { color: '#4f46e5' },
});