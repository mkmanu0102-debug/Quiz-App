import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { api } from '../api';

export default function OtpScreen({ navigation, route }) {
  const { emailOrPhone } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(300);

  const isEmail = emailOrPhone && emailOrPhone.includes('@');

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 0) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter 6 digit OTP!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.verifyOtp(emailOrPhone, otp);
      if (res.message === 'Registration successful! Please login.') {
        navigation.navigate('Login');
      } else {
        setError(res.message || 'Invalid OTP!');
      }
    } catch (err) {
      setError('Server error! Please try again.');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.logo}>{isEmail ? '📧' : '📱'}</Text>
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>Check your {isEmail ? 'email' : 'phone'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Enter OTP</Text>
        <Text style={styles.phoneText}>OTP sent to: <Text style={styles.phone}>{emailOrPhone}</Text></Text>

        <View style={[styles.timerBox, { backgroundColor: timer > 60 ? '#d1fae5' : '#fee2e2' }]}>
          <Text style={[styles.timerText, { color: timer > 60 ? '#065f46' : '#dc2626' }]}>
            ⏱ {timer > 0 ? `Expires in: ${formatTime(timer)}` : 'OTP Expired!'}
          </Text>
        </View>

        {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text></View> : null}

        <Text style={styles.label}>Enter 6 Digit OTP</Text>
        <TextInput
          style={styles.otpInput}
          placeholder="0 0 0 0 0 0"
          placeholderTextColor="#aaa"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleVerify}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Verify OTP</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Register')}>
          <Text style={styles.backText}>← Back to Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f4ff' },
  topSection: { backgroundColor: '#4f46e5', padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  logo: { fontSize: 50, marginBottom: 8 },
  title: { fontSize: 28, color: '#fff', marginBottom: 5 },
  subtitle: { fontSize: 15, color: '#c7d2fe' },
  card: { backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 25, marginTop: 25 },
  cardTitle: { fontSize: 22, color: '#1e1b4b', marginBottom: 10 },
  phoneText: { color: '#6b7280', fontSize: 14, marginBottom: 15 },
  phone: { color: '#4f46e5', fontWeight: '700' },
  timerBox: { borderRadius: 8, padding: 10, marginBottom: 15, alignItems: 'center' },
  timerText: { fontSize: 14, fontWeight: '700' },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, marginBottom: 15 },
  error: { color: '#dc2626', fontSize: 13 },
  label: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  otpInput: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, color: '#111', fontSize: 28, marginBottom: 20, textAlign: 'center', letterSpacing: 15 },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 20, alignItems: 'center' },
  backText: { color: '#4f46e5', fontSize: 14 },
});