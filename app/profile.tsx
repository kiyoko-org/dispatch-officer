import { AuthGuard } from '@/components/auth-guard';
import { NavBar } from '@/components/nav-bar';
import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { getDispatchClient, useOfficers } from 'dispatch-lib';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function ProfileScreenContent() {
  const { colors } = useTheme();
  const { user, signOut } = useOfficerAuth();
  const [revealedFields, setRevealedFields] = useState<{ [key: string]: boolean }>({
    email: false,
    phone: false,
    officerId: false,
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [resolvedReportsCount, setResolvedReportsCount] = useState(0);
  const [totalReportsCount, setTotalReportsCount] = useState(0);

  // Get officer data to check for assigned reports
  const officersHook = useOfficers();
  const { officers } = officersHook;
  const currentOfficer = useMemo(() => officers.find((o: any) => o.id === user?.id), [officers, user?.id]);
  const assignedReportId = currentOfficer?.assigned_report_id as number | null | undefined;

  // Fallback: direct Supabase query to avoid RPC 42804
  async function fetchResolvedReportsCountFallback(officerId: string | number): Promise<number> {
    try {
      const client = getDispatchClient();
      const { data, error } = await client.supabaseClient
        .from('reports')
        .select('id, officers_involved, status')
        .eq('status', 'resolved');

      if (error || !data) {
        console.error('Resolved count fallback error:', error);
        return 0;
      }

      const count = (data as any[]).filter((r) => {
        const list = (r as any).officers_involved;
        if (Array.isArray(list)) {
          return list.includes(officerId) || list.includes(Number(officerId));
        }
        // If the field isn't an array, include by default (consistent with Resolved screen fallback)
        return true;
      }).length;

      return count;
    } catch (e) {
      console.error('Resolved count fallback unexpected error:', e);
      return 0;
    }
  }

  // Fetch resolved reports count
  useEffect(() => {
    async function fetchResolvedReportsCount() {
      if (!user?.id) {
        setResolvedReportsCount(0);
        return;
      }

      try {
        // Use fallback-only to avoid RPC 42804 errors
        const count = await fetchResolvedReportsCountFallback(user.id);
        setResolvedReportsCount(count);
        setTotalReportsCount(count + (assignedReportId ? 1 : 0));
      } catch (error) {
        console.error('Error fetching resolved reports count:', error);
        setResolvedReportsCount(0);
        setTotalReportsCount(assignedReportId ? 1 : 0);
      }
    }

    fetchResolvedReportsCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, assignedReportId]);

  const toggleFieldVisibility = (field: string) => {
    setRevealedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  async function confirmLogout() {
    setShowLogoutModal(false);
    await signOut();
    router.replace('/login');
  }

  // Get user data from authentication context
  const officerData = {
    id: user?.id || 'N/A',
    name: user?.user_metadata?.first_name && user?.user_metadata?.last_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : 'Officer',
    rank: user?.user_metadata?.rank || 'Police Officer',
    badge_number: user?.user_metadata?.badge_number || 'N/A',
    email: user?.email || 'N/A',
    // These would come from additional database queries in a real app
    station: 'Tuguegarao City Police Station',
    department: 'Traffic Management Division',
    phone: '+63 912 345 6789',
    joined_date: 'January 15, 2020',
    status: 'Active',
    assigned_area: 'Tuguegarao City Center',
    total_reports: totalReportsCount,
    resolved_reports: resolvedReportsCount,
    pending_reports: assignedReportId ? 1 : 0, // Synced with assigned report
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Navigation Bar */}
      <NavBar
        title="Officer Profile"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        showLeftIcon={true}
        showRightIcon={false}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{officerData.name}</Text>
          <Text style={[styles.rank, { color: colors.textSecondary }]}>{officerData.rank}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{officerData.status}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="document-text" size={24} color="#3B82F6" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{officerData.total_reports}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Reports</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{officerData.resolved_reports}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resolved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="time" size={24} color="#F59E0B" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{officerData.pending_reports}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <InfoRow icon="card" label="Badge Number" value={officerData.badge_number} colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoRow icon="business" label="Station" value={officerData.station} colors={colors} />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <BlurredInfoRow 
              icon="mail" 
              label="Email" 
              value={officerData.email} 
              colors={colors}
              isRevealed={revealedFields.email}
              onToggle={() => toggleFieldVisibility('email')}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <BlurredInfoRow 
              icon="call" 
              label="Phone Number" 
              value={officerData.phone} 
              colors={colors}
              isRevealed={revealedFields.phone}
              onToggle={() => toggleFieldVisibility('phone')}
            />
          </View>
        </View>

        {/* Service Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Information</Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <InfoRow icon="calendar" label="Joined PNP" value={officerData.joined_date} colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <BlurredInfoRow 
              icon="shield-checkmark" 
              label="Officer ID" 
              value={officerData.id} 
              colors={colors}
              isRevealed={revealedFields.officerId}
              onToggle={() => toggleFieldVisibility('officerId')}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={() => setShowLogoutModal(true)}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="log-out-outline" size={48} color="#DC2626" />
            </View>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to logout?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function ProfileScreen() {
  return (
    <AuthGuard>
      <ProfileScreenContent />
    </AuthGuard>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function BlurredInfoRow({ 
  icon, 
  label, 
  value, 
  colors, 
  isRevealed, 
  onToggle 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: string; 
  colors: any;
  isRevealed: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text 
          style={[
            styles.infoValue, 
            { color: colors.text },
            !isRevealed && styles.blurredText
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {isRevealed ? value : '••••••••••••'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  rank: {
    fontSize: 16,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  blurredValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  blurredText: {
    letterSpacing: 2,
  },
  eyeIcon: {
    marginLeft: 4,
    flexShrink: 0,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
    borderWidth: 0,
  },
  logoutButtonText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
