import React, {useState, useEffect} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import {useAuth} from '../context/AuthContext';

export default function VerifyOtpScreen({route}: any) {
  const {registerNumber} = route.params;
  const {setUser, setRole} = useAuth();

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [batchId, setBatchId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLateralEntry, setIsLateralEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);

  useEffect(() => {
    axiosInstance
      .get('/students/dropdown-data')
      .then(res => {
        setBatches(res.data.batches || []);
        setBranches(res.data.branches || []);
      })
      .catch(() => Alert.alert('Error', 'Failed to load batch/branch data'));
  }, []);

  const handleSubmit = async () => {
    if (!otp || !password || !batchId || !branchId) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/verify-otp', {
        registerNumber,
        otp,
        password,
        batch: batchId,
        branch: branchId,
        isLateralEntry,
      });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('role', 'student');
      setRole('student');
      // fetch user info
      const me = await axiosInstance.get('/students/me');
      setUser(me.data);
    } catch (err: any) {
      Alert.alert(
        'Verification Failed',
        err.response?.data?.error || err.response?.data?.message || 'OTP verification failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedBatch = batches.find(b => b._id === batchId);
  const selectedBranch = branches.find(b => b._id === branchId);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>📧</Text>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Check your registered email for the OTP code</Text>
          <Text style={styles.regNo}>{registerNumber}</Text>
        </View>

        <View style={styles.card}>
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

          <Text style={styles.label}>Set Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Set a password for future logins"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          {/* Batch selector */}
          <Text style={styles.label}>Batch</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => {setBatchOpen(!batchOpen); setBranchOpen(false);}}>
            <Text style={selectedBatch ? styles.selectorText : styles.selectorPlaceholder}>
              {selectedBatch ? selectedBatch.name : 'Select Batch'}
            </Text>
            <Text style={styles.chevron}>{batchOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {batchOpen && (
            <View style={styles.dropdown}>
              {batches.map(b => (
                <TouchableOpacity
                  key={b._id}
                  style={[styles.dropdownItem, batchId === b._id && styles.dropdownItemActive]}
                  onPress={() => {setBatchId(b._id); setBatchOpen(false);}}>
                  <Text style={[styles.dropdownText, batchId === b._id && styles.dropdownTextActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Branch selector */}
          <Text style={styles.label}>Branch</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => {setBranchOpen(!branchOpen); setBatchOpen(false);}}>
            <Text style={selectedBranch ? styles.selectorText : styles.selectorPlaceholder}>
              {selectedBranch ? selectedBranch.name : 'Select Branch'}
            </Text>
            <Text style={styles.chevron}>{branchOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {branchOpen && (
            <View style={styles.dropdown}>
              {branches.map(b => (
                <TouchableOpacity
                  key={b._id}
                  style={[styles.dropdownItem, branchId === b._id && styles.dropdownItemActive]}
                  onPress={() => {setBranchId(b._id); setBranchOpen(false);}}>
                  <Text style={[styles.dropdownText, branchId === b._id && styles.dropdownTextActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Lateral Entry */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setIsLateralEntry(!isLateralEntry)}
            disabled={loading}>
            <View style={[styles.checkbox, isLateralEntry && styles.checkboxChecked]}>
              {isLateralEntry && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>
              I am a <Text style={{fontWeight: '700'}}>Lateral Entry</Text> student{' '}
              <Text style={{color: '#6b7280', fontSize: 12}}>(requires 40 pts)</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Verify & Complete Setup</Text>
            )}
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
  regNo: {
    marginTop: 8, backgroundColor: '#e0e7ff', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 20, color: '#1e3a8a', fontWeight: '600', fontSize: 13,
  },
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
  selector: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectorText: {fontSize: 15, color: '#111827'},
  selectorPlaceholder: {fontSize: 15, color: '#9ca3af'},
  chevron: {color: '#6b7280', fontSize: 12},
  dropdown: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, marginTop: 4, maxHeight: 200, overflow: 'hidden',
  },
  dropdownItem: {paddingHorizontal: 14, paddingVertical: 12},
  dropdownItemActive: {backgroundColor: '#eff6ff'},
  dropdownText: {fontSize: 15, color: '#374151'},
  dropdownTextActive: {color: '#1e3a8a', fontWeight: '600'},
  checkRow: {flexDirection: 'row', alignItems: 'center', marginTop: 14},
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: '#9ca3af',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  checkboxChecked: {backgroundColor: '#1e3a8a', borderColor: '#1e3a8a'},
  checkmark: {color: '#fff', fontSize: 13, fontWeight: '700'},
  checkLabel: {flex: 1, fontSize: 14, color: '#374151'},
  btnPrimary: {
    backgroundColor: '#1e3a8a', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  btnDisabled: {opacity: 0.5},
  btnText: {color: '#fff', fontWeight: '700', fontSize: 16},
});
