import { LocationMapModal } from '@/components/location-map-modal';
import { NavBar } from '@/components/nav-bar';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data - in a real app this would come from an API/database
const REPORT_DATA: Record<string, any> = {
  '1': {
    id: 1,
    reporter_id: 'R-2024-001',
    incident_title: 'Traffic Accident on Main Street',
    incident_date: '2024-01-15',
    incident_time: '14:30',
    street_address: 'Bonifacio Street',
    nearby_landmark: 'Near Tuguegarao City Hall',
    city: 'Tuguegarao City',
    province: 'Cagayan',
    coordinates: { latitude: 17.6132, longitude: 121.7270 }, // Tuguegarao City Hall
    brief_description: 'Two-vehicle collision at intersection. Both drivers were cooperative. Minor injuries reported.',
    vehicle_description: '2 sedans involved',
    who_was_involved: 'Driver A: John Doe, Driver B: Jane Smith',
    number_of_witnesses: 3,
    injuries_reported: 'Minor injuries to Driver A',
    property_damage: 'Front-end damage to both vehicles',
    suspect_description: 'N/A',
    additional_info: 'Traffic was redirected for 2 hours',
    request_follow_up: true,
    share_with_community: false,
    is_anonymous: false,
    category: 'Traffic Accident',
    status: 'Assigned',
    resolved_at: null,
  },
  '2': {
    id: 2,
    reporter_id: 'R-2024-002',
    incident_title: 'Robbery Report - Downtown',
    incident_date: '2024-01-16',
    incident_time: '22:15',
    street_address: 'Luna Street',
    nearby_landmark: 'Near SM City Tuguegarao',
    city: 'Tuguegarao City',
    province: 'Cagayan',
    coordinates: { latitude: 17.6189, longitude: 121.7308 }, // SM Tuguegarao area
    brief_description: 'Store robbery with witnesses. Suspect fled on motorcycle.',
    vehicle_description: 'Black motorcycle, license plate partially visible',
    who_was_involved: 'Store owner: Maria Garcia, 2 employees present',
    number_of_witnesses: 5,
    injuries_reported: 'None',
    property_damage: 'Cash register damaged, approximately ₱50,000 stolen',
    suspect_description: 'Male, approximately 5\'8", wearing dark clothing and helmet',
    additional_info: 'CCTV footage available',
    request_follow_up: true,
    share_with_community: true,
    is_anonymous: false,
    category: 'Robbery',
    status: 'Assigned',
    resolved_at: null,
  },
  '3': {
    id: 3,
    reporter_id: 'R-2024-003',
    incident_title: 'Vandalism at City Park',
    incident_date: '2024-01-17',
    incident_time: '08:00',
    street_address: 'Rizal Park',
    nearby_landmark: 'Near Children\'s Playground',
    city: 'Tuguegarao City',
    province: 'Cagayan',
    coordinates: { latitude: 17.6095, longitude: 121.7235 }, // Tuguegarao City Park area
    brief_description: 'Graffiti on park benches and walls discovered during morning inspection.',
    vehicle_description: 'None',
    who_was_involved: 'Unknown perpetrators',
    number_of_witnesses: 0,
    injuries_reported: 'None',
    property_damage: '15 park benches and 3 walls defaced',
    suspect_description: 'Unknown',
    additional_info: 'Park security footage under review',
    request_follow_up: true,
    share_with_community: true,
    is_anonymous: false,
    category: 'Vandalism',
    status: 'Assigned',
    resolved_at: null,
  },
  '4': {
    id: 4,
    reporter_id: 'R-2024-004',
    incident_title: 'Domestic Disturbance',
    incident_date: '2024-01-18',
    incident_time: '19:45',
    street_address: 'Pengue-Ruyu Street',
    nearby_landmark: 'Barangay Ugac Sur',
    city: 'Tuguegarao City',
    province: 'Cagayan',
    coordinates: { latitude: 17.6201, longitude: 121.7189 }, // Residential area Tuguegarao
    brief_description: 'Noise complaint from neighbors. Loud argument heard from unit.',
    vehicle_description: 'None',
    who_was_involved: 'Residents of Unit 7B',
    number_of_witnesses: 4,
    injuries_reported: 'None visible',
    property_damage: 'None reported',
    suspect_description: 'N/A',
    additional_info: 'Neighbors request patrol in area',
    request_follow_up: true,
    share_with_community: false,
    is_anonymous: true,
    category: 'Disturbance',
    status: 'Assigned',
    resolved_at: null,
  },
};

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const report = REPORT_DATA[id || ''];
  const [showMapModal, setShowMapModal] = useState(false);

  if (!report) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Report Not Found', headerShown: true }} />
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={[styles.errorText, { color: colors.text }]}>Report not found</Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
          <Text style={[styles.reportTitle, { color: colors.text }]}>{report.incident_title}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{report.status}</Text>
          </View>
        </View>

        {/* Reporter ID */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Report ID</Text>
          <Text style={[styles.sectionValue, { color: colors.text }]}>{report.reporter_id}</Text>
        </View>

        {/* Date & Time */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Date & Time</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {report.incident_date} at {report.incident_time}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Location</Text>
          
          {/* Map Preview - Full Width */}
          <TouchableOpacity
            style={styles.mapPreview}
            onPress={() => setShowMapModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={64} color={colors.primary} />
              <Text style={[styles.mapPlaceholderTitle, { color: colors.primary }]}>Location Map</Text>
              <Text style={[styles.mapPlaceholderText, { color: colors.primary }]}>
                {report.coordinates.latitude.toFixed(6)}, {report.coordinates.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.mapPreviewOverlay}>
              <View style={styles.mapExpandButton}>
                <Ionicons name="navigate" size={20} color="#FFFFFF" />
                <Text style={styles.mapExpandText}>Tap to view full map & directions</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Location Details */}
          <View style={[styles.locationDetailsCard, { backgroundColor: colors.background }]}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoText, { color: colors.text }]}>{report.street_address}</Text>
                <Text style={[styles.infoTextSecondary, { color: colors.textSecondary }]}>
                  {report.city}, {report.province}
                </Text>
                {report.nearby_landmark && (
                  <Text style={[styles.infoTextSecondary, { color: colors.textSecondary }]}>
                    Near: {report.nearby_landmark}
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
            <Text style={styles.categoryText}>{report.category}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: colors.text }]}>{report.brief_description}</Text>
        </View>

        {/* Involved Parties */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Who Was Involved</Text>
          <Text style={[styles.sectionValue, { color: colors.text }]}>{report.who_was_involved}</Text>
        </View>

        {/* Witnesses */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Number of Witnesses</Text>
          <Text style={[styles.sectionValue, { color: colors.text }]}>{report.number_of_witnesses}</Text>
        </View>

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
      {report.coordinates && (
        <LocationMapModal
          visible={showMapModal}
          onClose={() => setShowMapModal(false)}
          incidentLocation={{
            latitude: report.coordinates.latitude,
            longitude: report.coordinates.longitude,
            title: report.incident_title,
            address: `${report.street_address}, ${report.city}, ${report.province}`,
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

