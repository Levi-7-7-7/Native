import React, {useEffect, useState, useMemo} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import axiosInstance from '../api/axiosInstance';
import {useAuth} from '../context/AuthContext';
import {calcCappedPoints, passThreshold} from '../utils/calcPoints';

export default function DashboardScreen({navigation}: any) {
  const {user, setUser, logout} = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, certRes, catRes] = await Promise.all([
        axiosInstance.get('/students/me'),
        axiosInstance.get('/certificates/my'),
        axiosInstance.get('/categories'),
      ]);
      setUser(userRes.data);
      setCertificates(certRes.data.certificates || []);
      setCategories(catRes.data.categories || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cappedTotal = useMemo(() => {
    if (!certificates.length || !categories.length) return 0;
    const approved = certificates.filter(
      c => c.status?.toLowerCase() === 'approved',
    );
    return calcCappedPoints(approved, categories, user?.isLateralEntry ?? false);
  }, [certificates, categories, user]);

  const PASS_POINTS = passThreshold(user?.isLateralEntry);
  const hasPassed = cappedTotal >= PASS_POINTS;

  const userName = user?.name || 'Student';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {setRefreshing(true); fetchData();}}
          colors={['#1e3a8a']}
        />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarGroup}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.helloText}>Hello, {userName}</Text>
            <Text style={styles.welcomeText}>Welcome back!</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Points Card */}
      <View style={styles.pointsCard}>
        <View>
          <Text style={styles.pointsLabel}>Activity Points</Text>
          {loading ? (
            <ActivityIndicator color="#ca8a04" style={{marginTop: 6}} />
          ) : (
            <Text style={styles.pointsValue}>{cappedTotal}</Text>
          )}
          <Text style={styles.pointsCaption}>of {PASS_POINTS} required</Text>
        </View>
        <Text style={styles.awardEmoji}>🏆</Text>
      </View>

      {/* Progress bar */}
      {!loading && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {width: `${Math.min((cappedTotal / PASS_POINTS) * 100, 100)}%`},
              hasPassed && styles.progressFillPassed,
            ]}
          />
        </View>
      )}

      {/* Pass badge */}
      {!loading && hasPassed && (
        <View style={styles.passCard}>
          <Text style={styles.passEmoji}>🎉</Text>
          <View style={styles.passInfo}>
            <Text style={styles.passTitle}>Activity Points Completed!</Text>
            <Text style={styles.passSubtitle}>
              You have successfully met the required activity points.
            </Text>
          </View>
          <View style={styles.passBadge}>
            <Text style={styles.passBadgeText}>PASSED</Text>
          </View>
        </View>
      )}

      {/* Recent Activities */}
      <Text style={styles.sectionTitle}>Recent Activities</Text>
      <View style={styles.activitiesCard}>
        {loading ? (
          [1, 2, 3].map(n => (
            <View key={n} style={styles.skeletonRow}>
              <View style={styles.skeletonCircle} />
              <View style={styles.skeletonLine} />
            </View>
          ))
        ) : certificates.length === 0 ? (
          <Text style={styles.noData}>
            No activities yet. Upload your first certificate!
          </Text>
        ) : (
          certificates.slice(0, 5).map(cert => (
            <View key={cert._id} style={styles.activityRow}>
              <View style={styles.activityLeft}>
                <View style={styles.activityDot} />
                <View>
                  <Text style={styles.activityName}>{cert.subcategory}</Text>
                  <Text style={styles.activityDate}>
                    {new Date(cert.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.activityRight}>
                <Text
                  style={[
                    styles.activityStatus,
                    cert.status?.toLowerCase() === 'approved'
                      ? styles.statusApproved
                      : cert.status?.toLowerCase() === 'rejected'
                      ? styles.statusRejected
                      : styles.statusPending,
                  ]}>
                  {cert.status?.toLowerCase() === 'approved'
                    ? `+${cert.pointsAwarded || 0} pts`
                    : cert.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* View all link */}
      {!loading && certificates.length > 0 && (
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('Certificates')}>
          <Text style={styles.viewAllText}>View All Certificates →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f0f4ff'},
  content: {padding: 20, paddingBottom: 100},
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  avatarGroup: {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e3a8a',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {color: '#fff', fontWeight: '700', fontSize: 16},
  helloText: {fontSize: 17, fontWeight: '700', color: '#111827'},
  welcomeText: {fontSize: 13, color: '#6b7280'},
  logoutBtn: {
    backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
  },
  logoutText: {color: '#dc2626', fontWeight: '600', fontSize: 13},
  pointsCard: {
    backgroundColor: '#1e3a8a', borderRadius: 20, padding: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1e3a8a', shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  pointsLabel: {color: '#bfdbfe', fontSize: 13, fontWeight: '500'},
  pointsValue: {color: '#fff', fontSize: 48, fontWeight: '800', marginTop: 4},
  pointsCaption: {color: '#93c5fd', fontSize: 13},
  awardEmoji: {fontSize: 48},
  progressBar: {
    backgroundColor: '#e0e7ff', borderRadius: 8, height: 8, marginBottom: 16, overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#3b82f6', height: '100%', borderRadius: 8,
  },
  progressFillPassed: {backgroundColor: '#22c55e'},
  passCard: {
    backgroundColor: '#d1fae5', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12,
  },
  passEmoji: {fontSize: 28},
  passInfo: {flex: 1},
  passTitle: {fontSize: 15, fontWeight: '700', color: '#065f46'},
  passSubtitle: {fontSize: 12, color: '#047857', marginTop: 2},
  passBadge: {
    backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  passBadgeText: {color: '#fff', fontWeight: '800', fontSize: 11},
  sectionTitle: {fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12},
  activitiesCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  skeletonRow: {flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 12},
  skeletonCircle: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb'},
  skeletonLine: {flex: 1, height: 14, borderRadius: 7, backgroundColor: '#e5e7eb'},
  activityRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  activityLeft: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
  activityDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6',
  },
  activityName: {fontSize: 14, fontWeight: '600', color: '#111827'},
  activityDate: {fontSize: 12, color: '#6b7280', marginTop: 2},
  activityRight: {},
  activityStatus: {fontSize: 13, fontWeight: '700'},
  statusApproved: {color: '#059669'},
  statusPending: {color: '#d97706'},
  statusRejected: {color: '#dc2626'},
  noData: {textAlign: 'center', color: '#6b7280', padding: 20, fontSize: 14},
  viewAllBtn: {marginTop: 16, alignItems: 'center'},
  viewAllText: {color: '#2563eb', fontWeight: '600', fontSize: 14},
});
