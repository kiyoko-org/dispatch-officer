import { AuthGuard } from '@/components/auth-guard';
import { NavBar } from '@/components/nav-bar';
import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfficers } from 'dispatch-lib';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function ResolvedReportsContent() {
	const router = useRouter();
	const { colors } = useTheme();
	const { user } = useOfficerAuth();
	const officersHook = useOfficers();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [loading, setLoading] = useState(true);
	const [resolvedReports, setResolvedReports] = useState<any[]>([]);

	// Get officers list for name lookup
	const { officers } = officersHook;

	// Create a map of officer IDs to officer data for quick lookup
	const officersMap = useMemo(() => {
		const map = new Map();
		officers.forEach((officer: any) => {
			map.set(officer.id, officer);
		});
		return map;
	}, [officers]);

	// Helper function to get officer name by ID
	const getOfficerName = (officerId: string | number) => {
		const officer = officersMap.get(officerId);
		if (!officer) return `Officer ${officerId}`;
		
		const firstName = officer.first_name || officer.user_metadata?.first_name || '';
		const lastName = officer.last_name || officer.user_metadata?.last_name || '';
		const badgeNumber = officer.badge_number || officer.user_metadata?.badge_number || '';
		
		if (firstName || lastName) {
			return `${firstName} ${lastName}`.trim() + (badgeNumber ? ` ${badgeNumber}` : '');
		}
		return badgeNumber ? `Officer ${badgeNumber}` : `Officer ${officerId}`;
	};

	// Check if getResolvedReports function exists in the hook
	const getResolvedReports = (officersHook as any).getResolvedReports;

	useEffect(() => {
		async function fetchResolvedReports() {
			if (!user?.id) {
				setResolvedReports([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				// Try to use getResolvedReports if it exists
				if (getResolvedReports && typeof getResolvedReports === 'function') {
					const { data, error } = await getResolvedReports(user.id);
					if (!error && data) {
						setResolvedReports(data);
					} else {
						console.error('Error fetching resolved reports:', error);
						setResolvedReports([]);
					}
				} else {
					console.warn('getResolvedReports function not available in useOfficers hook');
					setResolvedReports([]);
				}
			} catch (error) {
				console.error('Error in fetchResolvedReports:', error);
				setResolvedReports([]);
			} finally {
				setLoading(false);
			}
		}

		fetchResolvedReports();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id]);

	async function handleRefresh() {
		if (!user?.id) return;
		
		setIsRefreshing(true);
		try {
			// Try to use getResolvedReports if it exists
			if (getResolvedReports && typeof getResolvedReports === 'function') {
				const { data, error } = await getResolvedReports(user.id);
				if (!error && data) {
					setResolvedReports(data);
				}
			}
		} catch (error) {
			console.error('Error refreshing resolved reports:', error);
		} finally {
			setIsRefreshing(false);
		}
	}

	function handleReportPress(reportId: number) {
		router.push(`/report/${reportId}` as any);
	}

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
			{/* Navigation Bar */}
			<NavBar
				title="Resolved Reports"
				leftIcon="arrow-back"
				onLeftPress={() => router.back()}
				showLeftIcon={true}
				showRightIcon={false}
			/>

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
									Reported: {item.incident_date ? new Date(item.incident_date).toLocaleDateString() : new Date(item.created_at).toLocaleDateString()} {item.incident_time ? `at ${item.incident_time}` : ''}
								</Text>
							</View>
							{(item as any).resolved_at && (
								<View style={styles.detailRow}>
									<Ionicons name="checkmark-done-outline" size={16} color={colors.textSecondary} />
									<Text style={[styles.detailText, { color: colors.textSecondary }]}>
										Resolved: {new Date((item as any).resolved_at).toLocaleDateString()} at {new Date((item as any).resolved_at).toLocaleTimeString()}
									</Text>
								</View>
							)}
						</View>

						{/* Officers Involved */}
						{item.officers_involved && item.officers_involved.length > 0 && (
							<View style={styles.officersCard}>
								<View style={styles.officersHeader}>
									<Ionicons name="people-outline" size={16} color="#3B82F6" />
									<Text style={styles.officersTitle}>Officers Involved</Text>
								</View>
								{item.officers_involved.map((officerId: string | number, index: number) => (
									<Text key={index} style={styles.officerName}>
										• {getOfficerName(officerId)}
									</Text>
								))}
							</View>
						)}

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
	officersCard: {
		backgroundColor: '#EFF6FF',
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
		borderLeftWidth: 3,
		borderLeftColor: '#3B82F6',
	},
	officersHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 8,
	},
	officersTitle: {
		fontSize: 13,
		fontWeight: '600',
		color: '#1E40AF',
	},
	officerName: {
		fontSize: 13,
		color: '#1E3A8A',
		lineHeight: 20,
		marginLeft: 4,
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
