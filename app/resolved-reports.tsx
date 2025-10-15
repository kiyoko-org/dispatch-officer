import { NavBar } from '@/components/nav-bar';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for resolved reports
const RESOLVED_REPORTS = [
	{
		id: 5,
		incident_title: 'Noise Complaint - Residential',
		incident_date: '2024-01-10',
		incident_time: '23:15',
		street_address: 'Aguinaldo Street',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Late night party noise disturbance',
		status: 'Resolved',
		resolved_date: '2024-01-11',
		resolution_notes: 'Warning issued to property owner. Noise stopped immediately.',
	},
	{
		id: 6,
		incident_title: 'Lost Property Report',
		incident_date: '2024-01-09',
		incident_time: '16:45',
		street_address: 'Bonifacio Street',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Missing wallet reported at shopping area',
		status: 'Resolved',
		resolved_date: '2024-01-10',
		resolution_notes: 'Wallet recovered and returned to owner. Found by store staff.',
	},
	{
		id: 7,
		incident_title: 'Vehicle Parking Violation',
		incident_date: '2024-01-08',
		incident_time: '09:30',
		street_address: 'Luna Street',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Car blocking driveway entrance',
		status: 'Resolved',
		resolved_date: '2024-01-08',
		resolution_notes: 'Vehicle owner contacted and moved car. Citation issued.',
	},
	{
		id: 8,
		incident_title: 'Public Disturbance',
		incident_date: '2024-01-07',
		incident_time: '14:20',
		street_address: 'Rizal Park',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Group causing disturbance in public park',
		status: 'Resolved',
		resolved_date: '2024-01-07',
		resolution_notes: 'Group dispersed peacefully. No arrests made.',
	},
	{
		id: 9,
		incident_title: 'Stray Animal Report',
		incident_date: '2024-01-06',
		incident_time: '11:00',
		street_address: 'Pengue-Ruyu Street',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Multiple stray dogs in residential area',
		status: 'Resolved',
		resolved_date: '2024-01-07',
		resolution_notes: 'Animal control contacted. Dogs safely captured and relocated.',
	},
	{
		id: 10,
		incident_title: 'Traffic Light Malfunction',
		incident_date: '2024-01-05',
		incident_time: '07:45',
		street_address: 'Bonifacio-Luna Intersection',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Traffic signal not working properly',
		status: 'Resolved',
		resolved_date: '2024-01-06',
		resolution_notes: 'Public works department notified. Signal repaired within 24 hours.',
	},
];

export default function ResolvedReportsScreen() {
	const router = useRouter();
	const { colors } = useTheme();

	function handleReportPress(reportId: number) {
		router.push(`/report/${reportId}` as any);
	}

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
			{/* Navigation Bar */}
			<NavBar
				title="Resolved Reports"
				leftIcon="arrow-back"
				onLeftPress={() => router.back()}
				showLeftIcon={true}
				showRightIcon={false}
			/>

			{/* Header Stats */}
			<View style={[styles.statsHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
				<View style={styles.statBox}>
					<Ionicons name="checkmark-circle" size={32} color="#10B981" />
					<Text style={styles.statNumber}>{RESOLVED_REPORTS.length}</Text>
					<Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Resolved</Text>
				</View>
			</View>

			{/* Reports List */}
			<FlatList
				data={RESOLVED_REPORTS}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.listContent}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={[styles.reportCard, { backgroundColor: colors.card }]}
						onPress={() => handleReportPress(item.id)}
						activeOpacity={0.7}
					>
						<View style={styles.cardHeader}>
							<View style={styles.headerLeft}>
								<Ionicons name="checkmark-circle" size={24} color="#10B981" />
								<Text style={[styles.reportTitle, { color: colors.text }]}>{item.incident_title}</Text>
							</View>
						</View>

						<View style={styles.cardDetails}>
							<View style={styles.detailRow}>
								<Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
								<Text style={[styles.detailText, { color: colors.textSecondary }]}>
									Reported: {item.incident_date} at {item.incident_time}
								</Text>
							</View>
							<View style={styles.detailRow}>
								<Ionicons name="checkmark-done-outline" size={16} color={colors.textSecondary} />
								<Text style={[styles.detailText, { color: colors.textSecondary }]}>Resolved: {item.resolved_date}</Text>
							</View>
							<View style={styles.detailRow}>
								<Ionicons name="location-outline" size={16} color={colors.textSecondary} />
								<Text style={[styles.detailText, { color: colors.textSecondary }]}>
									{item.street_address}, {item.city}
								</Text>
							</View>
						</View>

						<Text style={[styles.reportDescription, { color: colors.text }]}>{item.brief_description}</Text>

						{/* Resolution Notes */}
						<View style={styles.resolutionCard}>
							<View style={styles.resolutionHeader}>
								<Ionicons name="document-text-outline" size={16} color="#059669" />
								<Text style={styles.resolutionTitle}>Resolution Notes</Text>
							</View>
							<Text style={styles.resolutionText}>{item.resolution_notes}</Text>
						</View>

						<View style={styles.statusBadge}>
							<Ionicons name="checkmark-circle" size={14} color="#059669" />
							<Text style={styles.statusText}>{item.status}</Text>
						</View>
					</TouchableOpacity>
				)}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Ionicons name="checkmark-done-outline" size={64} color={colors.border} />
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No resolved reports</Text>
						<Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
							Reports you have successfully resolved will appear here
						</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	statsHeader: {
		padding: 16,
		borderBottomWidth: 1,
		alignItems: 'center',
	},
	statBox: {
		alignItems: 'center',
		gap: 8,
	},
	statNumber: {
		fontSize: 32,
		fontWeight: '700',
		color: '#10B981',
	},
	statLabel: {
		fontSize: 14,
		fontWeight: '500',
	},
	listContent: {
		padding: 16,
	},
	reportCard: {
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#D1FAE5',
		borderLeftWidth: 4,
		borderLeftColor: '#10B981',
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flex: 1,
	},
	reportTitle: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	cardDetails: {
		marginBottom: 12,
	},
	detailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
		gap: 8,
	},
	detailText: {
		fontSize: 14,
	},
	reportDescription: {
		fontSize: 14,
		marginBottom: 12,
		lineHeight: 20,
	},
	resolutionCard: {
		backgroundColor: '#ECFDF5',
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
		borderLeftWidth: 3,
		borderLeftColor: '#10B981',
	},
	resolutionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 6,
	},
	resolutionTitle: {
		fontSize: 13,
		fontWeight: '600',
		color: '#059669',
	},
	resolutionText: {
		fontSize: 13,
		color: '#065F46',
		lineHeight: 18,
	},
	statusBadge: {
		alignSelf: 'flex-start',
		backgroundColor: '#D1FAE5',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	statusText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#059669',
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 64,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: '600',
		marginTop: 16,
	},
	emptySubtext: {
		fontSize: 14,
		marginTop: 8,
		textAlign: 'center',
		paddingHorizontal: 32,
	},
});
