import React, {useState, useEffect, useMemo} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Linking,
} from 'react-native';
import axiosInstance from '../api/axiosInstance';
import {useAuth} from '../context/AuthContext';
import {calcCappedPoints, passThreshold} from '../utils/calcPoints';

const FILTERS = ['all', 'approved', 'pending', 'rejected'];

export default function CertificatesScreen() {
  const {user} = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [certRes, catRes] = await Promise.all([
        axiosInstance.get('/certificates/my'),
        axiosInstance.get('/categories'),
      ]);
      setCertificates(certRes.data.certificates || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load certificates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPoints = useMemo(() => {
    const approved = certificates.filter(
      c => c.status?.toLowerCase() === 'approved',
    );
    return calcCappedPoints(approved, categories, user?.isLateralEntry ?? false);
  }, [certificates, categories, user]);

  const PASS_POINTS = passThreshold(user?.isLateralEntry);

  const filteredCertificates =
    activeFilter === 'all'
      ? certificates
      : certificates.filter(c => c.status?.toLowerCase() === activeFilter);

  const displayPoints = (cert: any) => {
    if (cert.status?.toLowerCase() === 'approved') return cert.pointsAwarded ?? 0;
    return cert.potentialPoints ?? 0;
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return {badge: styles.badgeApproved, text: styles.badgeTextApproved};
      case 'pending': return {badge: styles.badgePending, text: styles.badgeTextPending};
      case 'rejected': return {badge: styles.badgeRejected, text: styles.badgeTextRejected};
      default: return {badge: styles.badgeDefault, text: styles.badgeTextDefault};
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📄';
    }
  };

  const handleViewCert = (cert: any) => {
    if (cert.fileUrl) {
      Linking.openURL(cert.fileUrl);
    } else {
      Alert.alert('No file', 'No file attached to this certificate.');
    }
  };

  const handleCancelCert = (cert: any) => {
    Alert.alert(
      'Cancel Certificate',
      `Cancel and delete "${cert.eventName || cert.subcategory || 'this certificate'}"? This cannot be undone.`,
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(cert._id);
            try {
              await axiosInstance.delete(`/certificates/${cert._id}`);
              setCertificates(prev => prev.filter(c => c._id !== cert._id));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to cancel.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
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
      <Text style={styles.pageTitle}>My Certificates</Text>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryPoints}>{totalPoints}</Text>
          <Text style={styles.summaryLabel}>Total Points (Capped)</Text>
          <Text style={styles.summaryOf}>of {PASS_POINTS} required</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryCount}>{certificates.length}</Text>
          <Text style={styles.summaryCountLabel}>
            {certificates.length === 1 ? 'certificate' : 'certificates'} submitted
          </Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {FILTERS.map(f => {
          const count = f === 'all' ? null : certificates.filter(c => c.status?.toLowerCase() === f).length;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f)}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {count !== null ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Certificates list */}
      {loading ? (
        [1, 2, 3].map(n => (
          <View key={n} style={styles.skeletonCard}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, {width: '60%', marginTop: 8}]} />
          </View>
        ))
      ) : filteredCertificates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No certificates found</Text>
          <Text style={styles.emptySub}>
            {activeFilter === 'all'
              ? "You haven't submitted any certificates yet."
              : `No ${activeFilter} certificates.`}
          </Text>
        </View>
      ) : (
        filteredCertificates.map(cert => {
          const {badge, text: badgeText} = getStatusStyle(cert.status);
          return (
            <View key={cert._id} style={styles.certCard}>
              {/* Header row */}
              <View style={styles.certHeader}>
                <Text style={styles.certName} numberOfLines={2}>
                  {cert.subcategory || 'Certificate'}
                </Text>
                <Text style={styles.certEmoji}>{getStatusEmoji(cert.status)}</Text>
              </View>

              {/* Category badge */}
              {cert.category?.name && (
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>{cert.category.name}</Text>
                </View>
              )}

              {/* Level / Prize */}
              {(cert.level || cert.prizeType) && (
                <Text style={styles.levelText}>
                  🏅 {cert.level}{cert.level && cert.prizeType ? ' — ' : ''}{cert.prizeType}
                </Text>
              )}

              {/* Status */}
              <View style={[styles.statusBadge, badge]}>
                <Text style={[styles.statusBadgeText, badgeText]}>{cert.status}</Text>
              </View>

              {/* Footer */}
              <View style={styles.certFooter}>
                <Text style={styles.certDate}>
                  📅 {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : '—'}
                </Text>
                <Text style={styles.certPoints}>+{displayPoints(cert)} pts</Text>
              </View>

              {/* Rejection reason */}
              {cert.status?.toLowerCase() === 'rejected' && (
                <View style={styles.rejectedBox}>
                  <Text style={styles.rejectedTitle}>❌ Certificate Rejected</Text>
                  <Text style={styles.rejectedReason}>
                    {cert.rejectionReason || 'No reason provided. Please contact your tutor.'}
                  </Text>
                  <Text style={styles.rejectedHint}>You can re-upload a corrected certificate.</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                {cert.fileUrl && (
                  <TouchableOpacity
                    style={styles.btnView}
                    onPress={() => handleViewCert(cert)}>
                    <Text style={styles.btnViewText}>👁 View</Text>
                  </TouchableOpacity>
                )}
                {cert.status?.toLowerCase() === 'pending' && (
                  <TouchableOpacity
                    style={[styles.btnCancel, deletingId === cert._id && styles.btnDisabled]}
                    onPress={() => handleCancelCert(cert)}
                    disabled={deletingId === cert._id}>
                    <Text style={styles.btnCancelText}>
                      {deletingId === cert._id ? 'Cancelling…' : '🗑 Cancel'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f0f4ff'},
  content: {padding: 20, paddingBottom: 120},
  pageTitle: {fontSize: 22, fontWeight: '800', color: '#1e3a8a', marginBottom: 16},
  summaryCard: {
    backgroundColor: '#1e3a8a', borderRadius: 20, padding: 20,
    flexDirection: 'row', marginBottom: 16,
    shadowColor: '#1e3a8a', shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  summaryLeft: {flex: 1},
  summaryPoints: {fontSize: 44, fontWeight: '800', color: '#fff'},
  summaryLabel: {color: '#bfdbfe', fontSize: 13},
  summaryOf: {color: '#93c5fd', fontSize: 12, marginTop: 2},
  summaryRight: {alignItems: 'flex-end', justifyContent: 'center'},
  summaryCount: {fontSize: 28, fontWeight: '700', color: '#fff'},
  summaryCountLabel: {color: '#bfdbfe', fontSize: 13, textAlign: 'right'},
  filterRow: {marginBottom: 16},
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  filterBtnActive: {backgroundColor: '#1e3a8a', borderColor: '#1e3a8a'},
  filterText: {fontSize: 13, fontWeight: '600', color: '#374151'},
  filterTextActive: {color: '#fff'},
  certCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  certHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  certName: {flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', marginRight: 8},
  certEmoji: {fontSize: 22},
  catBadge: {
    backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 8,
    paddingVertical: 3, alignSelf: 'flex-start', marginTop: 8,
  },
  catBadgeText: {color: '#1e40af', fontSize: 12, fontWeight: '600'},
  levelText: {fontSize: 13, color: '#374151', marginTop: 8},
  statusBadge: {
    alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10,
    paddingVertical: 4, marginTop: 10,
  },
  statusBadgeText: {fontSize: 12, fontWeight: '700'},
  badgeApproved: {backgroundColor: '#d1fae5'},
  badgeTextApproved: {color: '#059669'},
  badgePending: {backgroundColor: '#fef9c3'},
  badgeTextPending: {color: '#d97706'},
  badgeRejected: {backgroundColor: '#fee2e2'},
  badgeTextRejected: {color: '#dc2626'},
  badgeDefault: {backgroundColor: '#f3f4f6'},
  badgeTextDefault: {color: '#374151'},
  certFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  certDate: {fontSize: 13, color: '#6b7280'},
  certPoints: {fontSize: 14, fontWeight: '700', color: '#059669'},
  rejectedBox: {
    backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, marginTop: 12,
  },
  rejectedTitle: {fontWeight: '700', color: '#dc2626', fontSize: 13},
  rejectedReason: {fontSize: 13, color: '#7f1d1d', marginTop: 4},
  rejectedHint: {fontSize: 12, color: '#991b1b', marginTop: 4, fontStyle: 'italic'},
  actions: {flexDirection: 'row', gap: 10, marginTop: 12},
  btnView: {
    backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 8, flex: 1, alignItems: 'center',
  },
  btnViewText: {color: '#1e40af', fontWeight: '600', fontSize: 13},
  btnCancel: {
    backgroundColor: '#fee2e2', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 8, flex: 1, alignItems: 'center',
  },
  btnCancelText: {color: '#dc2626', fontWeight: '600', fontSize: 13},
  btnDisabled: {opacity: 0.5},
  skeletonCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
  },
  skeletonLine: {height: 16, backgroundColor: '#e5e7eb', borderRadius: 8, width: '80%'},
  emptyState: {alignItems: 'center', paddingVertical: 50},
  emptyEmoji: {fontSize: 52, marginBottom: 12},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#374151'},
  emptySub: {fontSize: 14, color: '#6b7280', marginTop: 6, textAlign: 'center'},
});
