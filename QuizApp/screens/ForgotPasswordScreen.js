import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { api } from '../api';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(300); // 5 min countdown for OTP verification
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            setTimerActive(false);
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleRequestOtp = async () => {
    if (!emailOrPhone) {
      setError('Please enter your email or phone number!');
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

    setLoading(true);
    setError('');
    try {
      const res = await api.forgotPassword(trimmedInput);
      if (res.message && res.message.includes('OTP sent')) {
        setStep(2);
        setTimer(300);
        setTimerActive(true);
        Alert.alert('OTP Sent', res.message);
      } else {
        setError(res.message || 'Failed to send OTP!');
      }
    } catch (err) {
      setError('Server error! Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter 6-digit OTP!');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.resetPassword(emailOrPhone.trim(), otp, newPassword);
      if (res.message && res.message.includes('successful')) {
        Alert.alert('Success', 'Password reset successfully! Please login with your new password.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        setError(res.message || 'Failed to reset password!');
      }
    } catch (err) {
      setError('Server error! Please try again.');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.logo}>🔑</Text>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Recover your account access</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{step === 1 ? 'Request OTP' : 'Create New Password'}</Text>

        {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text></View> : null}

        {step === 1 ? (
          <View>
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

            <TouchableOpacity style={styles.button} onPress={handleRequestOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.phoneText}>OTP sent to: <Text style={styles.phone}>{emailOrPhone}</Text></Text>

            <View style={[styles.timerBox, { backgroundColor: timer > 60 ? '#d1fae5' : '#fee2e2' }]}>
              <Text style={[styles.timerText, { color: timer > 60 ? '#065f46' : '#dc2626' }]}>
                ⏱ {timer > 0 ? `Expires in: ${formatTime(timer)}` : 'OTP Expired!'}
              </Text>
            </View>

            <Text style={styles.label}>Enter 6-Digit OTP</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#aaa"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor="#aaa"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              placeholderTextColor="#aaa"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => { setStep(1); setError(''); }}>
              <Text style={styles.backLink}>← Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Remembered your password? <Text style={styles.loginLink}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f4ff' },
  topSection: { backgroundColor: '#4f46e5', padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  logo: { fontSize: 50, marginBottom: 8 },
  title: { fontSize: 32, color: '#fff', marginBottom: 5, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#c7d2fe' },
  card: { backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 25, marginTop: 25 },
  cardTitle: { fontSize: 22, color: '#1e1b4b', marginBottom: 20, fontWeight: '700' },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, marginBottom: 15 },
  error: { color: '#dc2626', fontSize: 13 },
  label: { color: '#374151', fontSize: 14, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, color: '#111', fontSize: 15, marginBottom: 16 },
  otpInput: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, color: '#111', fontSize: 22, marginBottom: 16, textAlign: 'center', letterSpacing: 8 },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  phoneText: { color: '#6b7280', fontSize: 14, marginBottom: 15 },
  phone: { color: '#4f46e5', fontWeight: '700' },
  timerBox: { borderRadius: 8, padding: 10, marginBottom: 15, alignItems: 'center' },
  timerText: { fontSize: 14, fontWeight: '700' },
  loginBtn: { marginTop: 20, alignItems: 'center' },
  loginText: { color: '#6b7280', fontSize: 14 },
  loginLink: { color: '#4f46e5', fontWeight: '600' },
  backBtn: { marginTop: 15, alignItems: 'center' },
  backLink: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
});
