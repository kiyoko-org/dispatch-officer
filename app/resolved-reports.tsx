import { AuthGuard } from '@/components/auth-guard';
import { NavBar } from '@/components/nav-bar';
import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useReports } from 'dispatch-lib';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function ResolvedReportsContent() {
	const router = useRouter();
	const { colors } = useTheme();
	const { user } = useOfficerAuth();
	const { reports } = useReports();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [loading, setLoading] = useState(true);

	// Filter reports that are resolved and were assigned to this officer
	const resolvedReports = useMemo(() => {
		if (!user?.id) return [];
		const filtered = reports
			.filter(report => {
				// Show resolved reports only
				if (report.status !== 'resolved') return false;
				
				// Check if this report has officer_assigned_date (meaning it was assigned to an officer)
				// This is the best indicator that an officer worked on this report
				return (report as any).officer_assigned_date != null;
			})
			.sort((a, b) => {
				// Sort by resolved_at if available, otherwise by created date
				const dateA = new Date((a as any).resolved_at || a.created_at).getTime();
				const dateB = new Date((b as any).resolved_at || b.created_at).getTime();
				return dateB - dateA; // Most recent first
			});
		
		// Set loading to false once we have data
		if (filtered.length > 0 || reports.length > 0) {
			setLoading(false);
		}
		
		return filtered;
	}, [reports, user?.id]);

	async function handleRefresh() {
		setIsRefreshing(true);
		// The useReports hook should automatically refetch
		// Add a small delay to show the refresh animation
		setTimeout(() => {
			setIsRefreshing(false);
		}, 500);
	}

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
					<Text style={styles.statNumber}>{resolvedReports.length}</Text>
					<Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Resolved</Text>
				</View>
			</View>

			{/* Reports List */}
			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
					<Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading resolved reports...</Text>
				</View>
			) : (
				<FlatList
					data={resolvedReports}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={styles.listContent}
					refreshing={isRefreshing}
					onRefresh={handleRefresh}
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
									Reported: {item.incident_date || item.created_at} {item.incident_time ? `at ${item.incident_time}` : ''}
								</Text>
							</View>
							<View style={styles.detailRow}>
								<Ionicons name="checkmark-done-outline" size={16} color={colors.textSecondary} />
								<Text style={[styles.detailText, { color: colors.textSecondary }]}>
									Resolved: {(item as any).resolved_at ? new Date((item as any).resolved_at).toLocaleDateString() : 'N/A'}
								</Text>
							</View>
							<View style={styles.detailRow}>
								<Ionicons name="location-outline" size={16} color={colors.textSecondary} />
								<Text style={[styles.detailText, { color: colors.textSecondary }]}>
									{item.street_address || item.nearby_landmark || 'No location specified'}
								</Text>
							</View>
						</View>

						<Text style={[styles.reportDescription, { color: colors.text }]}>
							{item.what_happened || 'No details provided'}
						</Text>

						{/* Resolution Notes */}
						{(item as any).resolution_notes && (
							<View style={styles.resolutionCard}>
								<View style={styles.resolutionHeader}>
									<Ionicons name="document-text-outline" size={16} color="#059669" />
									<Text style={styles.resolutionTitle}>Resolution Notes</Text>
								</View>
								<Text style={styles.resolutionText}>{(item as any).resolution_notes}</Text>
							</View>
						)}

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
			)}
		</SafeAreaView>
	);
}

export default function ResolvedReportsScreen() {
	return (
		<AuthGuard>
			<ResolvedReportsContent />
		</AuthGuard>
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
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 64,
	},
	loadingText: {
		fontSize: 16,
		marginTop: 12,
	},
});
