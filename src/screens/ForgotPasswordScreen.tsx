import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from '../api/axiosInstance';

export default function ForgotPasswordScreen({navigation}: any) {
  const [registerNumber, setRegisterNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!registerNumber.trim()) {
      Alert.alert('Error', 'Please enter your register number');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', {registerNumber: registerNumber.trim()});
      navigation.navigate('ResetPassword', {registerNumber: registerNumber.trim()});
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not send OTP. Please try again.');
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
          <Icon name="lock-reset" size={52} color="#1e3a8a" style={styles.headerIcon} />
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your register number and we'll send an OTP to your registered email
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Register Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ABC123456"
            placeholderTextColor="#9ca3af"
            value={registerNumber}
            onChangeText={setRegisterNumber}
            autoCapitalize="characters"
            editable={!loading}
            onSubmitEditing={handleSendOtp}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[styles.btnPrimary, (!registerNumber.trim() || loading) && styles.btnDisabled]}
            onPress={handleSendOtp}
            disabled={!registerNumber.trim() || loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            disabled={loading}>
            <Icon name="arrow-left" size={16} color="#2563eb" />
            <Text style={styles.backText}> Back to Login</Text>
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
  headerIcon: {marginBottom: 12},
  title: {fontSize: 24, fontWeight: '800', color: '#1e3a8a'},
  subtitle: {fontSize: 13, color: '#6b7280', marginTop: 6, textAlign: 'center', lineHeight: 20},
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#1e3a8a', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  label: {fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4},
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  btnPrimary: {
    backgroundColor: '#1e3a8a', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  btnDisabled: {opacity: 0.5},
  btnText: {color: '#fff', fontWeight: '700', fontSize: 16},
  backBtn: {marginTop: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center'},
  backText: {color: '#2563eb', fontSize: 14, fontWeight: '500'},
});
