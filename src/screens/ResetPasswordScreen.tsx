import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from '../api/axiosInstance';

export default function ResetPasswordScreen({route, navigation}: any) {
  const {registerNumber} = route.params;

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleReset = async () => {
    if (!otp || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/auth/reset-password', {
        registerNumber,
        otp,
        newPassword: password,
      });
      Alert.alert('Success', 'Password reset successfully!', [
        {text: 'Login', onPress: () => navigation.navigate('Login')},
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Reset failed. Check your OTP and try again.');
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
          <Icon name="email-check-outline" size={52} color="#1e3a8a" style={styles.headerIcon} />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the OTP sent to your registered email</Text>
          <View style={styles.regBadge}>
            <Icon name="account-outline" size={14} color="#1e3a8a" />
            <Text style={styles.regNo}> {registerNumber}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {/* OTP */}
          <Text style={styles.label}>OTP Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#9ca3af"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            editable={!loading}
          />

          {/* New Password */}
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              placeholder="Set your new password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={[
            styles.inputRow,
            passwordsMatch && styles.inputRowSuccess,
            passwordsMismatch && styles.inputRowError,
          ]}>
            <TextInput
              style={styles.inputFlex}
              placeholder="Re-enter your new password"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(v => !v)}>
              <Icon name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
            </TouchableOpacity>
            {passwordsMatch && <Icon name="check-circle" size={20} color="#16a34a" style={styles.statusIcon} />}
            {passwordsMismatch && <Icon name="close-circle" size={20} color="#dc2626" style={styles.statusIcon} />}
          </View>
          {passwordsMismatch && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}

          <TouchableOpacity
            style={[styles.btnPrimary, (loading || !otp || passwordsMismatch || !password) && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading || !otp || passwordsMismatch || !password}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            disabled={loading}>
            <Icon name="arrow-left" size={16} color="#2563eb" />
            <Text style={styles.backText}> Back</Text>
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
  subtitle: {fontSize: 13, color: '#6b7280', marginTop: 6, textAlign: 'center'},
  regBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10,
    backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  regNo: {color: '#1e3a8a', fontWeight: '600', fontSize: 13},
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
  inputRow: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  inputRowSuccess: {borderColor: '#16a34a'},
  inputRowError: {borderColor: '#dc2626'},
  inputFlex: {flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827'},
  eyeBtn: {padding: 4},
  statusIcon: {marginLeft: 4},
  errorText: {color: '#dc2626', fontSize: 12, marginTop: 4, marginLeft: 2},
  btnPrimary: {
    backgroundColor: '#1e3a8a', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  btnDisabled: {opacity: 0.5},
  btnText: {color: '#fff', fontWeight: '700', fontSize: 16},
  backBtn: {marginTop: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center'},
  backText: {color: '#2563eb', fontSize: 14, fontWeight: '500'},
});
