import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import axiosInstance from '../api/axiosInstance';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ForgotPasswordScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await axiosInstance.post('/auth/forgot-password', {email});
      setMessage(res.data.message || 'Reset link sent! Check your email.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <MaterialCommunityIcons name="lock-outline" size={48} color="#1e3a8a" />
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your registered email to receive a reset link</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            onSubmitEditing={handleSubmit}
          />

          {message ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ {message}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btnPrimary, (!email || loading) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!email || loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            disabled={loading}>
            <Text style={styles.backText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: '#f0f4ff'},
  container: {flexGrow: 1, justifyContent: 'center', padding: 20},
  header: {alignItems: 'center', marginBottom: 24},
  emoji: {fontSize: 48, marginBottom: 8},
  title: {fontSize: 24, fontWeight: '800', color: '#1e3a8a'},
  subtitle: {fontSize: 13, color: '#6b7280', marginTop: 4, textAlign: 'center'},
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#1e3a8a', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  label: {fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12},
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  successBox: {
    backgroundColor: '#d1fae5', borderRadius: 10, padding: 12, marginTop: 12,
  },
  successText: {color: '#065f46', fontSize: 14},
  btnPrimary: {
    backgroundColor: '#1e3a8a', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  btnDisabled: {opacity: 0.5},
  btnText: {color: '#fff', fontWeight: '700', fontSize: 16},
  backBtn: {marginTop: 14, alignItems: 'center'},
  backText: {color: '#2563eb', fontSize: 14, fontWeight: '500'},
});
