import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Mock data - in a real app this would come from an API/database
const REPORT_DATA: Record<string, any> = {
  '1': {
    id: 1,
    reporter_id: 'R-2024-001',
    incident_title: 'Traffic Accident on Main Street',
    incident_date: '2024-01-15',
    incident_time: '14:30',
    street_address: '123 Main Street',
    nearby_landmark: 'Near City Hall',
    city: 'Manila',
    province: 'Metro Manila',
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
    street_address: '456 Downtown Ave',
    nearby_landmark: 'Corner of 5th Avenue',
    city: 'Quezon City',
    province: 'Metro Manila',
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
    street_address: 'City Park, Zone 3',
    nearby_landmark: 'Near playground area',
    city: 'Makati',
    province: 'Metro Manila',
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
    street_address: '789 Residential St',
    nearby_landmark: 'Apartment Building 7B',
    city: 'Pasig',
    province: 'Metro Manila',
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
  const report = REPORT_DATA[id || ''];

  if (!report) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Report Not Found', headerShown: true }} />
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Report not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.floatingHeaderTitle}>Report Details</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Report Header */}
        <View style={styles.headerSection}>
          <Text style={styles.reportTitle}>{report.incident_title}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{report.status}</Text>
          </View>
        </View>

        {/* Reporter ID */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Report ID</Text>
          <Text style={styles.sectionValue}>{report.reporter_id}</Text>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date & Time</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={styles.infoText}>
              {report.incident_date} at {report.incident_time}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoText}>{report.street_address}</Text>
              <Text style={styles.infoTextSecondary}>
                {report.city}, {report.province}
              </Text>
              {report.nearby_landmark && (
                <Text style={styles.infoTextSecondary}>
                  Near: {report.nearby_landmark}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{report.category}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{report.brief_description}</Text>
        </View>

        {/* Involved Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Who Was Involved</Text>
          <Text style={styles.sectionValue}>{report.who_was_involved}</Text>
        </View>

        {/* Witnesses */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Number of Witnesses</Text>
          <Text style={styles.sectionValue}>{report.number_of_witnesses}</Text>
        </View>

        {/* Injuries */}
        {report.injuries_reported && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Injuries Reported</Text>
            <Text style={styles.sectionValue}>{report.injuries_reported}</Text>
          </View>
        )}

        {/* Property Damage */}
        {report.property_damage && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Property Damage</Text>
            <Text style={styles.sectionValue}>{report.property_damage}</Text>
          </View>
        )}

        {/* Vehicle Description */}
        {report.vehicle_description && report.vehicle_description !== 'None' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Vehicle Description</Text>
            <Text style={styles.sectionValue}>{report.vehicle_description}</Text>
          </View>
        )}

        {/* Suspect Description */}
        {report.suspect_description && report.suspect_description !== 'N/A' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Suspect Description</Text>
            <Text style={styles.sectionValue}>{report.suspect_description}</Text>
          </View>
        )}

        {/* Additional Info */}
        {report.additional_info && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Additional Information</Text>
            <Text style={styles.sectionValue}>{report.additional_info}</Text>
          </View>
        )}

        {/* Flags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Report Flags</Text>
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
          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Mark as Resolved</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
            <Text style={styles.secondaryButtonText}>Add Notes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 96,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#111827',
  },
  infoTextSecondary: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#374151',
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
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  floatingHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3B82F6',
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

