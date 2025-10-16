import { AuthGuard } from '@/components/auth-guard';
import { NavBar } from '@/components/nav-bar';
import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfficers, useReports } from 'dispatch-lib';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function IndexContent() {
	const router = useRouter();
	const { colors } = useTheme();
	const { user, signOut } = useOfficerAuth();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const drawerX = useRef(new Animated.Value(-280)).current;
	const backdropOpacity = useRef(new Animated.Value(0)).current;

	// Get officer and assigned report id
	const { officers, loading: officersLoading } = useOfficers();
	const currentOfficer = useMemo(() => officers.find((o: any) => o.id === user?.id), [officers, user?.id]);
	const assignedReportId = currentOfficer?.assigned_report_id as number | null | undefined;

	// Fetch only the assigned report using dispatch-lib
	const { getReportInfo } = useReports();
	const [isFetching, setIsFetching] = useState(true);
	const [assignedReport, setAssignedReport] = useState<any | null>(null);

	async function loadAssignedReport() {
		if (!assignedReportId) {
			setAssignedReport(null);
			setIsFetching(false);
			return;
		}
		setIsFetching(true);
		try {
			const { data, error } = await getReportInfo(assignedReportId);
			if (error) {
				console.error('Error fetching assigned report:', error);
			}
			setAssignedReport(data || null);
		} finally {
			setIsFetching(false);
		}
	}

	useEffect(() => {
		// Load when officer data ready or assignedReportId changes
		if (!officersLoading) {
			loadAssignedReport();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [officersLoading, assignedReportId]);

	function handleReportPress(reportId: number) {
		router.push(`/report/${reportId}` as any);
	}

	function openMenu() {
		setIsMenuOpen(true);
		Animated.parallel([
			Animated.timing(drawerX, { toValue: 0, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
			Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
		]).start();
	}

	function closeMenu() {
		Animated.parallel([
			Animated.timing(drawerX, { toValue: -280, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
			Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
		]).start(({ finished }) => { if (finished) setIsMenuOpen(false); });
	}

	const listData = useMemo(() => (assignedReport ? [assignedReport] : []), [assignedReport]);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
			{/* Navigation Bar */}
			<NavBar
				title="Assigned Reports"
				leftIcon="person-circle-outline"
				onLeftPress={openMenu}
				showLeftIcon={true}
				showRightIcon={false}
			/>

			{/* Reports List */}
			{isFetching ? (
				<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<ActivityIndicator size="large" color={colors.primary} />
					<Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading assigned report…</Text>
				</View>
			) : (
				<FlatList
					data={listData}
					keyExtractor={(item: any) => item.id.toString()}
					contentContainerStyle={styles.listContent}
					onRefresh={async () => { await loadAssignedReport(); }}
					refreshing={isFetching}
					renderItem={({ item }: { item: any }) => (
						<TouchableOpacity
							style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
							onPress={() => handleReportPress(item.id)}
							activeOpacity={0.7}
						>
							<View style={styles.cardHeader}>
								<Text style={[styles.reportTitle, { color: colors.text }]}>
									{item.incident_title || `Report #${item.id}`}
								</Text>
								<Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
							</View>
							<View style={styles.cardDetails}>
								<View style={styles.detailRow}>
									<Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
									<Text style={[styles.detailText, { color: colors.textSecondary }]}>
										{item.incident_date || item.created_at || '—'}{item.incident_time ? ` at ${item.incident_time}` : ''}
									</Text>
								</View>
								<View style={styles.detailRow}>
									<Ionicons name="location-outline" size={16} color={colors.textSecondary} />
									<Text style={[styles.detailText, { color: colors.textSecondary }]}>
										{item.street_address || item.nearby_landmark || 'No location specified'}
									</Text>
								</View>
							</View>
							<Text style={[styles.reportDescription, { color: colors.text }]} numberOfLines={2}>
								{item.what_happened || item.brief_description || 'No details provided'}
							</Text>
							<View style={styles.statusBadge}>
								<Text style={styles.statusText}>{(item.status || 'pending').toString()}</Text>
							</View>
						</TouchableOpacity>
					)}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Ionicons name="documents-outline" size={64} color={colors.border} />
							<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No assigned report</Text>
						</View>
					}
				/>
			)}

			{/* Floating sidebar + backdrop */}
			{(isMenuOpen || (backdropOpacity as any)) && (
				<Animated.View pointerEvents={isMenuOpen ? 'auto' : 'none'} style={[styles.backdrop, { opacity: backdropOpacity }]}>
					<Pressable style={{ flex: 1 }} onPress={closeMenu} />
				</Animated.View>
			)}
			<Animated.View style={[styles.drawer, { backgroundColor: colors.card, borderRightColor: colors.border, transform: [{ translateX: drawerX }] }]}>
				<View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
					<Ionicons name="person-circle" size={48} color={colors.primary} />
					<View>
						<Text style={[styles.drawerTitle, { color: colors.text }] }>
							{user?.user_metadata?.first_name ? 
								`${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : 
								'Officer'
							}
						</Text>
						<Text style={[styles.drawerSubtitle, { color: colors.textSecondary }] }>
							Badge #{user?.user_metadata?.badge_number || 'N/A'}
						</Text>
					</View>
				</View>
				<View style={styles.menuList}>
					<MenuItem icon="person-outline" label="Profile" onPress={() => { closeMenu(); router.push('/profile'); }} colors={colors} />
					<MenuItem icon="settings-outline" label="Settings" onPress={() => { closeMenu(); router.push('/settings'); }} colors={colors} />
					<MenuItem icon="checkmark-done-outline" label="Resolved Reports" onPress={() => { closeMenu(); router.push('/resolved-reports'); }} colors={colors} />
				</View>
				<View style={[styles.menuFooter, { borderTopColor: colors.border }]}>
					<MenuItem icon="log-out-outline" label="Logout" destructive onPress={async () => { 
						closeMenu(); 
						await signOut();
						router.replace('/login'); 
					}} colors={colors} />
				</View>
			</Animated.View>

		</SafeAreaView>
	);
}

export default function Index() {
	return (
		<AuthGuard>
			<IndexContent />
		</AuthGuard>
	);
}

function MenuItem({ icon, label, onPress, destructive, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; destructive?: boolean; colors: any }) {
	return (
		<TouchableOpacity onPress={onPress} style={styles.menuItem}>
			<Ionicons name={icon} size={20} color={destructive ? '#DC2626' : colors.text} />
			<Text style={[styles.menuItemText, { color: destructive ? '#DC2626' : colors.text }]}>{label}</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		padding: 16,
	},
	reportCard: {
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
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
	},
	detailText: {
		fontSize: 14,
		marginLeft: 8,
	},
	reportDescription: {
		fontSize: 14,
		marginBottom: 12,
		lineHeight: 20,
	},
	statusBadge: {
		alignSelf: 'flex-start',
		backgroundColor: '#DBEAFE',
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 12,
	},
	statusText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#1E40AF',
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 60,
	},
	emptyText: {
		fontSize: 16,
		marginTop: 12,
	},
	backdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.4)',
	},
	drawer: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		width: 280,
		borderRightWidth: 1,
		paddingTop: 52,
	},
	drawerHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 16,
		paddingBottom: 16,
		borderBottomWidth: 1,
	},
	drawerTitle: {
		fontSize: 18,
		fontWeight: '700',
	},
	drawerSubtitle: {
		fontSize: 12,
	},
	menuList: {
		paddingTop: 8,
		paddingHorizontal: 8,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 10,
	},
	menuItemText: {
		fontSize: 16,
	},
	menuFooter: {
		marginTop: 'auto',
		padding: 8,
		borderTopWidth: 1,
	},
});


