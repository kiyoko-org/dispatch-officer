import { LocationMapModal } from '@/components/location-map-modal';
import { NavBar } from '@/components/nav-bar';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useReports, useCategories } from 'dispatch-lib';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

// Dark mode map style for Google Maps
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, activeTheme } = useTheme();
  const { getReportInfo } = useReports();
  const { categories } = useCategories();

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

  async function openDrivingNavigation(lat: number, lng: number, label?: string) {
    const encodedLabel = encodeURIComponent(label || 'Destination');
    const googleMapsAppUrl = `google.navigation:q=${lat},${lng}`; // Android Google Maps intent
    const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving&destination_place_id=${encodedLabel}`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    try {
      if (Platform.OS === 'ios') {
        const canOpenApple = await Linking.canOpenURL('maps://');
        if (canOpenApple) {
          await Linking.openURL(`maps://?daddr=${lat},${lng}&dirflg=d`);
          return;
        }
        await Linking.openURL(appleMapsUrl);
        return;
      }
      const canOpenGoogle = await Linking.canOpenURL(googleMapsAppUrl);
      if (canOpenGoogle) {
        await Linking.openURL(googleMapsAppUrl);
        return;
      }
      await Linking.openURL(googleMapsWebUrl);
    } catch {
      // no-op: let the tap do nothing if maps cannot be opened
    }
  }

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
          
          {/* Description */}
          <Text style={[styles.descriptionText, { color: colors.text, marginTop: 12 }]}>{report.what_happened || report.brief_description || 'No description provided'}</Text>
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
          
          {/* Embedded Map */}
          {(latitude != null && longitude != null) ? (
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.embeddedMap}
                customMapStyle={activeTheme === 'dark' ? darkMapStyle : []}
                initialRegion={{
                  latitude: Number(latitude),
                  longitude: Number(longitude),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                  }}
                  title={report.incident_title || `Report #${report.id}`}
                  description={report.street_address || ''}
                >
                  <View style={styles.incidentMarker}>
                    <Ionicons name="location" color="#DC2626" size={28} />
                  </View>
                </Marker>
              </MapView>
              
              {/* Map Overlay with Actions */}
              <TouchableOpacity
                style={styles.mapOverlayButton}
                onPress={() => setShowMapModal(true)}
                activeOpacity={0.9}
              >
                <View style={styles.mapExpandButton}>
                  <Ionicons name="expand" size={18} color="#FFFFFF" />
                  <Text style={styles.mapExpandText}>View Full Map</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.mapNavigateButton}
                onPress={() => openDrivingNavigation(Number(latitude), Number(longitude), report.incident_title || `Report #${report.id}`)}
                activeOpacity={0.9}
              >
                <View style={styles.navigateButtonInner}>
                  <Ionicons name="navigate" size={18} color="#FFFFFF" />
                  <Text style={styles.navigateButtonText}>Navigate</Text>
                </View>
              </TouchableOpacity>
            </View>
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
                {(latitude != null && longitude != null) && (
                  <Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
                    {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Category */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Category</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {(() => {
                const category = categories?.find((cat: any) => cat.id === report.category_id);
                return category?.name || report.category || 'Uncategorized';
              })()}
            </Text>
          </View>
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

        {/* Witness Contact Info */}
        {report.witness_contact_info && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Witness Contact Information</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{report.witness_contact_info}</Text>
          </View>
        )}

        {/* Officers Involved */}
        {report.officers_involved && report.officers_involved.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Officers Involved</Text>
            {report.officers_involved.map((officer: any, index: number) => (
              <Text key={index} style={[styles.sectionValue, { color: colors.text }]}>
                {officer.name || officer.id || `Officer ${index + 1}`}
              </Text>
            ))}
          </View>
        )}

        {/* Resolution Date */}
        {report.resolved_at && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Resolved Date</Text>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {new Date(report.resolved_at).toLocaleDateString()} at {new Date(report.resolved_at).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}

        {/* Attachments */}
        {report.attachments && report.attachments.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Attachments</Text>
            <View style={styles.attachmentsContainer}>
              {report.attachments.map((attachment: any, index: number) => (
                <View key={index} style={[styles.attachmentItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="document-outline" size={20} color={colors.primary} />
                  <View style={styles.attachmentInfo}>
                    <Text style={[styles.attachmentName, { color: colors.text }]}>
                      {attachment.name || `Attachment ${index + 1}`}
                    </Text>
                    <Text style={[styles.attachmentType, { color: colors.textSecondary }]}>
                      {attachment.type || 'Unknown type'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => {}}>
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Additional Info */}
        {report.additional_info && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Additional Information</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{report.additional_info}</Text>
          </View>
        )}

        

        
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
  mapContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  embeddedMap: {
    width: '100%',
    height: '100%',
  },
  mapOverlayButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  mapNavigateButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  navigateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  incidentMarker: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
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
  coordinatesText: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'monospace',
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
  attachmentsContainer: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  attachmentType: {
    fontSize: 14,
    marginTop: 2,
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

