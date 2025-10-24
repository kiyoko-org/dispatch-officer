import { AuthGuard } from '@/components/auth-guard';
import { NavBar } from '@/components/nav-bar';
import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { getDispatchClient, useOfficers } from 'dispatch-lib';
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
	const [expandedOfficers, setExpandedOfficers] = useState<Set<number>>(new Set());
	const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
	const [fetchError, setFetchError] = useState<string | null>(null);

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
	// const getResolvedReports = (officersHook as any).getResolvedReports; // RPC disabled temporarily due to 42804 mismatch

	// Utils: safe date/time formatting
	function parseDate(value: any): Date | null {
		if (!value) return null;
		const d = new Date(value);
		return isNaN(d.getTime()) ? null : d;
	}

	function formatDateLocal(value: any): string {
		const d = parseDate(value);
		return d ? d.toLocaleDateString() : '';
	}

	function formatTimeNoSecondsFromDate(value: any): string {
		const d = parseDate(value);
		return d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
	}

	function toggleOfficers(reportId: number) {
		setExpandedOfficers((prev) => {
			const next = new Set(prev);
			if (next.has(reportId)) next.delete(reportId); else next.add(reportId);
			return next;
		});
	}

	function toggleNotes(reportId: number) {
		setExpandedNotes((prev) => {
			const next = new Set(prev);
			if (next.has(reportId)) next.delete(reportId); else next.add(reportId);
			return next;
		});
	}

	// Fallback query to avoid RPC type mismatch (42804) by querying Supabase directly
	async function fetchResolvedReportsFallback(officerId: string | number): Promise<any[]> {
		try {
			const client = getDispatchClient();
			const { data, error } = await client.supabaseClient
				.from('reports')
				.select('id, incident_title, incident_date, incident_time, created_at, resolved_at, officers_involved, police_notes, status')
				.eq('status', 'resolved')
				.order('resolved_at', { ascending: false });

		if (error || !data) {
			console.error('Fallback fetch error:', error);
			throw error || new Error('No data returned');
		}

		// If officers_involved is an array, filter to this officer; otherwise include all
		return (data as any[]).filter((r) => {
			const list = (r as any).officers_involved;
			if (Array.isArray(list)) {
				return list.includes(officerId) || list.includes(Number(officerId));
			}
			return true;
		});
	} catch (e) {
		console.error('Fallback fetch unexpected error:', e);
		throw e;
	}
	}	useEffect(() => {
		async function fetchResolvedReports() {
			if (!user?.id) {
				setResolvedReports([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				// Fallback-only: avoid RPC 42804 error logs
				const fallback = await fetchResolvedReportsFallback(user.id);
				setResolvedReports(fallback);
				setFetchError(null);
			} catch (e) {
				console.error('Error fetching resolved reports:', e);
				setFetchError('Unable to load. Please check your internet and try again later');
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
			const fallback = await fetchResolvedReportsFallback(user.id);
			setResolvedReports(fallback);
			setFetchError(null);
		} catch (e) {
			console.error('Error refreshing resolved reports:', e);
			setFetchError('Unable to load. Please check your internet and try again later');
		} finally {
			setIsRefreshing(false);
		}
	}

	async function retryFetch() {
		if (!user?.id) return;
		setFetchError(null);
		setLoading(true);
		try {
			const fallback = await fetchResolvedReportsFallback(user.id);
			setResolvedReports(fallback);
			setFetchError(null);
		} catch (e) {
			console.error('Error retrying resolved reports fetch:', e);
			setFetchError('Unable to load. Please check your internet and try again later');
		} finally {
			setLoading(false);
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
			{fetchError ? (
				<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
					<View style={{ alignItems: 'center' }}>
						<Ionicons name="alert-circle-outline" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
						<Text style={[styles.errorTitle, { color: colors.text }]}>Unable to Load</Text>
						<Text style={[styles.errorMessage, { color: colors.textSecondary, marginVertical: 16 }]}>
							{fetchError}
						</Text>
						<TouchableOpacity
							style={[styles.retryButton, { backgroundColor: colors.primary }]}
							onPress={retryFetch}
						>
							<Ionicons name="refresh-outline" size={18} color="white" />
							<Text style={styles.retryButtonText}>Try Again</Text>
						</TouchableOpacity>
					</View>
				</View>
			) : loading ? (
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
					<View
						style={[styles.reportCard, { backgroundColor: colors.card }]}
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
									Reported: {formatDateLocal(item.incident_date) || formatDateLocal(item.created_at)} {item.incident_time ? `at ${item.incident_time}` : ''}
								</Text>
							</View>
							{(item as any).resolved_at && (
								<View style={styles.detailRow}>
									<Ionicons name="checkmark-done-outline" size={16} color={colors.textSecondary} />
									<Text style={[styles.detailText, { color: colors.textSecondary }]}>
										Resolved: {formatDateLocal((item as any).resolved_at)} at {formatTimeNoSecondsFromDate((item as any).resolved_at)}
									</Text>
								</View>
							)}
						</View>

						{/* Officers Involved */}
						{item.officers_involved && item.officers_involved.length > 0 && (
							<View style={styles.officersCard}>
								<TouchableOpacity style={styles.officersHeader} onPress={() => toggleOfficers(item.id)} activeOpacity={0.7}>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
										<Ionicons name="people-outline" size={16} color="#3B82F6" />
										<Text style={styles.officersTitle}>Officers Involved</Text>
									</View>
									<Ionicons name={expandedOfficers.has(item.id) ? 'chevron-up' : 'chevron-down'} size={18} color="#3B82F6" />
								</TouchableOpacity>
								{expandedOfficers.has(item.id) && item.officers_involved.map((officerId: string | number, index: number) => (
									<Text key={index} style={styles.officerName}>
										• {getOfficerName(officerId)}
									</Text>
								))}
							</View>
						)}

						{/* Police Notes */}
						{(((item as any).police_notes ?? (item as any).resolution_notes)) && (
							<View style={styles.resolutionCard}>
								<TouchableOpacity style={styles.resolutionHeader} onPress={() => toggleNotes(item.id)} activeOpacity={0.7}>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
										<Ionicons name="document-text-outline" size={16} color="#059669" />
										<Text style={styles.resolutionTitle}>Police Notes</Text>
									</View>
									<Ionicons name={expandedNotes.has(item.id) ? 'chevron-up' : 'chevron-down'} size={18} color="#059669" />
								</TouchableOpacity>
								{expandedNotes.has(item.id) && (
									<Text style={styles.resolutionText}>{(item as any).police_notes ?? (item as any).resolution_notes}</Text>
								)}
							</View>
						)}

						<View style={styles.statusBadge}>
							<Ionicons name="checkmark-circle" size={14} color="#059669" />
							<Text style={styles.statusText}>{item.status}</Text>
						</View>
					</View>
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
		justifyContent: 'space-between',
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
		justifyContent: 'space-between',
		width: '100%',
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
	errorTitle: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 8,
		textAlign: 'center',
	},
	errorMessage: {
		fontSize: 16,
		textAlign: 'center',
		lineHeight: 22,
	},
	retryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 10,
	},
	retryButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
	},
});
