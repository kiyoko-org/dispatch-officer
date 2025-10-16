import { LocationMapModal } from '@/components/location-map-modal';
import { NavBar } from '@/components/nav-bar';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useReports } from 'dispatch-lib';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { getReportInfo } = useReports();

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchReport() {
      if (!numericId) {
        setError('Invalid report id');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await getReportInfo(numericId);
        if (!mounted) return;
        if (error) {
          setError(typeof error === 'string' ? error : 'Failed to load report');
          setReport(null);
        } else {
          setReport(data || null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchReport();
    return () => { mounted = false };
    // IMPORTANT: don't include getReportInfo in deps, it's not stable and will cause refetch loops
  }, [numericId]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Stack.Screen options={{ title: 'Loading…', headerShown: true }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading report…</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Report Not Found', headerShown: true }} />
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Report not found'}</Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const latitude = report.latitude ?? report.coordinates?.latitude;
  const longitude = report.longitude ?? report.coordinates?.longitude;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Navigation Bar */}
      <NavBar
        title="Report Details"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        showLeftIcon={true}
        showRightIcon={false}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Report Header */}
        <View style={[styles.headerSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.reportTitle, { color: colors.text }]}>{report.incident_title || `Report #${report.id}`}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{(report.status || 'pending').toString()}</Text>
          </View>
        </View>

        {/* Reporter ID */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Report ID</Text>
          <Text style={[styles.sectionValue, { color: colors.text }]}>{report.reporter_id || report.id}</Text>
        </View>

        {/* Date & Time */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Date & Time</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {(report.incident_date || report.created_at || '—')}{report.incident_time ? ` at ${report.incident_time}` : ''}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Location</Text>
          
          {/* Map Preview - Full Width */}
          {(latitude != null && longitude != null) ? (
            <TouchableOpacity
              style={styles.mapPreview}
              onPress={() => setShowMapModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map" size={64} color={colors.primary} />
                <Text style={[styles.mapPlaceholderTitle, { color: colors.primary }]}>Location Map</Text>
                <Text style={[styles.mapPlaceholderText, { color: colors.primary }]}>
                  {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                </Text>
              </View>
              <View style={styles.mapPreviewOverlay}>
                <View style={styles.mapExpandButton}>
                  <Ionicons name="navigate" size={20} color="#FFFFFF" />
                  <Text style={styles.mapExpandText}>Tap to view full map & directions</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.mapPreview, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: colors.textSecondary }}>No coordinates available</Text>
            </View>
          )}

          {/* Location Details */}
          <View style={[styles.locationDetailsCard, { backgroundColor: colors.background }]}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoText, { color: colors.text }]}>{report.street_address || '—'}</Text>
                <Text style={[styles.infoTextSecondary, { color: colors.textSecondary }]}>
                  {(report.city || '').toString()}{report.province ? `, ${report.province}` : ''}
                </Text>
                {report.nearby_landmark && (
                  <Text style={[styles.infoTextSecondary, { color: colors.textSecondary }]}>Near: {report.nearby_landmark}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Category */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Category</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{(report.category || 'Uncategorized').toString()}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: colors.text }]}>{report.what_happened || report.brief_description || 'No description provided'}</Text>
        </View>

        {/* Involved Parties */}
        {report.who_was_involved && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Who Was Involved</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{report.who_was_involved}</Text>
          </View>
        )}

        {/* Witnesses */}
        {report.number_of_witnesses && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Number of Witnesses</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{report.number_of_witnesses}</Text>
          </View>
        )}

        {/* Injuries */}
        {report.injuries_reported && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Injuries Reported</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{report.injuries_reported}</Text>
          </View>
        )}

        {/* Property Damage */}
        {report.property_damage && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Property Damage</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{report.property_damage}</Text>
          </View>
        )}

        {/* Vehicle Description */}
        {report.vehicle_description && report.vehicle_description !== 'None' && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Vehicle Description</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{report.vehicle_description}</Text>
          </View>
        )}

        {/* Suspect Description */}
        {report.suspect_description && report.suspect_description !== 'N/A' && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Suspect Description</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{report.suspect_description}</Text>
          </View>
        )}

        {/* Additional Info */}
        {report.additional_info && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Additional Information</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{report.additional_info}</Text>
          </View>
        )}

        {/* Flags */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Report Flags</Text>
          <View style={styles.flagsContainer}>
            {report.request_follow_up && (
              <View style={styles.flagBadge}>
                <Ionicons name="refresh-outline" size={14} color="#1E40AF" />
                <Text style={styles.flagText}>Follow-up Requested</Text>
              </View>
            )}
            {report.share_with_community && (
              <View style={styles.flagBadge}>
                <Ionicons name="people-outline" size={14} color="#1E40AF" />
                <Text style={styles.flagText}>Share with Community</Text>
              </View>
            )}
            {report.is_anonymous && (
              <View style={styles.flagBadge}>
                <Ionicons name="eye-off-outline" size={14} color="#1E40AF" />
                <Text style={styles.flagText}>Anonymous</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Mark as Resolved</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Add Notes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Location Map Modal */}
      {(latitude != null && longitude != null) && (
        <LocationMapModal
          visible={showMapModal}
          onClose={() => setShowMapModal(false)}
          incidentLocation={{
            latitude: Number(latitude),
            longitude: Number(longitude),
            title: report.incident_title || `Report #${report.id}`,
            address: `${report.street_address || ''}${report.city ? `, ${report.city}` : ''}${report.province ? `, ${report.province}` : ''}`,
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  mapPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  mapPreviewImage: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  mapPlaceholderText: {
    fontSize: 13,
    marginTop: 6,
    fontFamily: 'monospace',
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  mapPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  mapExpandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  mapExpandText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  locationDetailsCard: {
    padding: 12,
    borderRadius: 8,
  },
  mapThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 16,
  },
  infoTextSecondary: {
    fontSize: 14,
    marginTop: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  flagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  flagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
  },
  actionButtons: {
    marginTop: 16,
    marginBottom: 32,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

