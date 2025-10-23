import { AuthGuard } from '@/components/auth-guard';
import { NavBar } from '@/components/nav-bar';
import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications, useRealtimeReports, getDispatchClient } from 'dispatch-lib';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function IndexContent() {
	const router = useRouter();
	const { colors } = useTheme();
	const { user, signOut } = useOfficerAuth();
	const insets = useSafeAreaInsets();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const drawerX = useRef(new Animated.Value(-280)).current;
	const backdropOpacity = useRef(new Animated.Value(0)).current;

	// Get notifications
	const { notifications: allNotifications } = useNotifications();
	const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
	const lastNotificationTimeRef = useRef(Date.now());

	// Load read notifications from AsyncStorage
	useEffect(() => {
		async function loadReadNotifications() {
			try {
				const stored = await AsyncStorage.getItem('readNotifications');
				if (stored) {
					setReadNotifications(new Set(JSON.parse(stored)));
				}
			} catch (error) {
				console.error('Error loading read notifications:', error);
			}
		}
		loadReadNotifications();
	}, []);

	// Calculate unread count and force update on notification arrival
	const [unreadCount, setUnreadCount] = useState(0);
	const [lastNotificationTime, setLastNotificationTime] = useState(Date.now());
	const [forceUpdate, setForceUpdate] = useState(0);
	const [notificationIds, setNotificationIds] = useState<string[]>([]);
	const lastCountRef = useRef(0);
	
	useEffect(() => {
		if (!user?.id) {
			setUnreadCount(0);
			lastCountRef.current = 0;
			return;
		}
		const count = allNotifications.filter(n => 
			n.user_id === user.id && !readNotifications.has(n.id)
		).length;
		
		// Only update if count increased or if it's a legitimate decrease
		// This prevents the optimistic count from being overridden too quickly
		if (count >= lastCountRef.current || Date.now() - lastNotificationTimeRef.current > 2000) {
			setUnreadCount(count);
			lastCountRef.current = count;
		}
		
		// Track notification IDs to detect new ones
		const currentIds = allNotifications.map(n => n.id);
		setNotificationIds(currentIds);
	}, [allNotifications, allNotifications.length, user?.id, readNotifications, lastNotificationTime, forceUpdate]);

	// Listen for incoming notifications and update badge immediately
	useEffect(() => {
		const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
			console.log('Notification received:', notification);
			console.log('Notification data:', notification.request.content.data);
			
			// Update timestamp ref
			lastNotificationTimeRef.current = Date.now();
			// Increment count optimistically for instant feedback
			setUnreadCount(prev => {
				const newCount = prev + 1;
				lastCountRef.current = newCount;
				return newCount;
			});
			// Trigger recalculation
			setLastNotificationTime(Date.now());
			
			// Check if this is a report assignment notification
			const notifData = notification.request.content.data as any;
			if (notifData?.type === 'report_assigned' && notifData?.report_id) {
				console.log('Report assignment detected, report ID:', notifData.report_id);
			}
			// Trigger a refresh to update the officer data and realtime reports
			setForceUpdate(prev => prev + 1);
			refreshRealtime();
		});

		return () => subscription.remove();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);



	// Track assigned report id for current officer without using useOfficers
	const [assignedReportId, setAssignedReportId] = useState<number | null | undefined>(undefined);
	const previousAssignedReportId = useRef<number | null | undefined>(assignedReportId);

	useEffect(() => {
		let subscription: any;
		let isMounted = true;
		async function initOfficerAssignmentWatcher() {
			if (!user?.id) return;
			const client = getDispatchClient();
			// Initial fetch of current officer assignment
			try {
				const { data, error } = await client.supabaseClient
					.from('officers')
					.select('assigned_report_id')
					.eq('id', user.id)
					.single();
				if (error) {
					console.error('Error fetching officer assigned_report_id:', error);
				} else if (isMounted) {
					setAssignedReportId((data as any)?.assigned_report_id ?? null);
					console.log('Initial assigned_report_id:', (data as any)?.assigned_report_id ?? null);
				}
			} catch (e) {
				console.error('Error initial officer fetch:', e);
			}

			// Realtime subscribe to this officer row only
			subscription = client.supabaseClient
				.channel(`officer-assignment-${user.id}`)
				.on(
					'postgres_changes',
					{ event: '*', schema: 'public', table: 'officers', filter: `id=eq.${user.id}` },
					(payload: any) => {
						const newAssigned = (payload.new as any)?.assigned_report_id ?? null;
						console.log('Officer realtime change - assigned_report_id:', newAssigned, 'event:', payload.eventType);
						setAssignedReportId(newAssigned);
					}
				)
				.subscribe((status: any) => {
					console.log('Officer assignment subscription status:', status);
				});
		}
		initOfficerAssignmentWatcher();
		return () => {
			isMounted = false;
			try {
				if (subscription) {
					const client = getDispatchClient();
					client.supabaseClient.removeChannel(subscription);
				}
			} catch {}
		};
	}, [user?.id, forceUpdate]);

	// Control realtime subscription so we can force a refetch on demand
	const [realtimeEnabled, setRealtimeEnabled] = useState(true);
	const refreshRealtime = useCallback(() => {
		// Toggle enabled to trigger unsubscribe -> subscribe which re-fetches
		setRealtimeEnabled(false);
		setTimeout(() => setRealtimeEnabled(true), 0);
	}, []);

	// Fetch all reports using real-time hook and filter for assigned report
	const { reports: allReports, loading: reportsLoading } = useRealtimeReports({ enabled: realtimeEnabled });
	const assignedReport = useMemo(() => {
		if (!assignedReportId) return null;
		const report = allReports.find((r: any) => r.id === assignedReportId);
		console.log('Found assigned report:', report?.incident_title, 'Status:', report?.status);
		return report || null;
	}, [allReports, assignedReportId]);
	const isFetching = reportsLoading;
	
	console.log('useRealtimeReports - assignedReport:', assignedReport?.incident_title, 'loading:', isFetching);

	// Reload read notifications and assigned report when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			console.log('Screen focused - reloading data');
			async function reloadData() {
				try {
					const stored = await AsyncStorage.getItem('readNotifications');
					const readSet = stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
					setReadNotifications(readSet);
					
					// Force recalculation with the latest allNotifications data
					// The useNotifications hook should automatically update when the screen refocuses
					if (user?.id) {
						const count = allNotifications.filter(n => 
							n.user_id === user.id && !readSet.has(n.id)
						).length;
						// Force update the count immediately
						setUnreadCount(count);
						lastCountRef.current = count;
						lastNotificationTimeRef.current = Date.now();
					}
				} catch (error) {
					console.error('Error loading read notifications:', error);
				}
				
				// Force a complete refresh of assigned report (officer watcher + realtime reports)
				console.log('Forcing data refresh on focus');
				setForceUpdate(prev => prev + 1);
				refreshRealtime();
			}
			reloadData();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [user?.id, allNotifications.length])
	);

	// Track when assigned report ID changes for logging
	useEffect(() => {
		console.log('assignedReportId changed:', previousAssignedReportId.current, '->', assignedReportId);
		previousAssignedReportId.current = assignedReportId;
	}, [assignedReportId]);

	

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

	function handleLogoutPress() {
		closeMenu();
		setShowLogoutModal(true);
	}

	async function confirmLogout() {
		setShowLogoutModal(false);
		await signOut();
		router.replace('/login');
	}

	const listData = useMemo(() => {
		// Filter out resolved reports
		if (assignedReport && assignedReport.status !== 'resolved') {
			return [assignedReport];
		}
		return [];
	}, [assignedReport]);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
			{/* Navigation Bar */}
			<NavBar
				title="Assigned Reports"
				leftIcon="person-circle-outline"
				onLeftPress={openMenu}
				rightIcon="notifications-outline"
				onRightPress={async () => {
					// Mark all current notifications as read in AsyncStorage
					if (user?.id) {
						const currentNotifications = allNotifications
							.filter(n => n.user_id === user.id)
							.map(n => n.id);
						
						try {
							await AsyncStorage.setItem('readNotifications', JSON.stringify(currentNotifications));
							setReadNotifications(new Set(currentNotifications));
							setUnreadCount(0);
							lastCountRef.current = 0;
						} catch (error) {
							console.error('Error marking notifications as read:', error);
						}
					}
					router.push('/notifications');
				}}
				showLeftIcon={true}
				showRightIcon={true}
				showNotificationBadge={unreadCount > 0}
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
					onRefresh={() => { setForceUpdate(prev => prev + 1); refreshRealtime(); }}
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

			{/* Dev-only: quick notification test trigger (only visible with no assigned report) */}
			

			{/* Floating sidebar + backdrop */}
			{(isMenuOpen || (backdropOpacity as any)) && (
				<Animated.View pointerEvents={isMenuOpen ? 'auto' : 'none'} style={[styles.backdrop, { opacity: backdropOpacity }]}>
					<Pressable style={{ flex: 1 }} onPress={closeMenu} />
				</Animated.View>
			)}
			<Animated.View style={[styles.drawer, { backgroundColor: colors.card, borderRightColor: colors.border, transform: [{ translateX: drawerX }] }]}>
				<SafeAreaView style={styles.drawerContent} edges={['top', 'bottom']}>
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
						<MenuItem icon="log-out-outline" label="Logout" destructive onPress={handleLogoutPress} colors={colors} />
					</View>
				</SafeAreaView>
			</Animated.View>

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
	},
	drawerContent: {
		flex: 1,
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


