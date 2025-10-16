import { AuthGuard } from '@/components/auth-guard';
import { NavBar } from '@/components/nav-bar';
import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for assigned reports
const MOCK_REPORTS = [
	{
		id: 1,
		incident_title: 'Traffic Accident on Main Street',
		incident_date: '2024-01-15',
		incident_time: '14:30',
		street_address: 'Bonifacio Street',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Two-vehicle collision at intersection',
		status: 'Assigned',
	},
	{
		id: 2,
		incident_title: 'Robbery Report - Downtown',
		incident_date: '2024-01-16',
		incident_time: '22:15',
		street_address: 'Luna Street',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Store robbery with witnesses',
		status: 'Assigned',
	},
	{
		id: 3,
		incident_title: 'Vandalism at City Park',
		incident_date: '2024-01-17',
		incident_time: '08:00',
		street_address: 'Rizal Park',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Graffiti on park benches and walls',
		status: 'Assigned',
	},
	{
		id: 4,
		incident_title: 'Domestic Disturbance',
		incident_date: '2024-01-18',
		incident_time: '19:45',
		street_address: 'Pengue-Ruyu Street',
		city: 'Tuguegarao City',
		province: 'Cagayan',
		brief_description: 'Noise complaint from neighbors',
		status: 'Assigned',
	},
];

function IndexContent() {
	const router = useRouter();
	const { colors } = useTheme();
	const { user, signOut } = useOfficerAuth();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const drawerX = useRef(new Animated.Value(-280)).current;
	const backdropOpacity = useRef(new Animated.Value(0)).current;

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
			<FlatList
				data={MOCK_REPORTS}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.listContent}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
						onPress={() => handleReportPress(item.id)}
						activeOpacity={0.7}
					>
						<View style={styles.cardHeader}>
							<Text style={[styles.reportTitle, { color: colors.text }]}>{item.incident_title}</Text>
							<Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
						</View>
						
						<View style={styles.cardDetails}>
							<View style={styles.detailRow}>
								<Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
								<Text style={[styles.detailText, { color: colors.textSecondary }]}>
									{item.incident_date} at {item.incident_time}
								</Text>
							</View>
							
							<View style={styles.detailRow}>
								<Ionicons name="location-outline" size={16} color={colors.textSecondary} />
								<Text style={[styles.detailText, { color: colors.textSecondary }]}>
									{item.street_address}, {item.city}
								</Text>
							</View>
						</View>

						<Text style={[styles.reportDescription, { color: colors.text }]} numberOfLines={2}>
							{item.brief_description}
						</Text>

						<View style={styles.statusBadge}>
							<Text style={styles.statusText}>{item.status}</Text>
						</View>
					</TouchableOpacity>
				)}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Ionicons name="documents-outline" size={64} color={colors.border} />
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No assigned reports</Text>
					</View>
				}
			/>

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
						<Text style={[styles.drawerTitle, { color: colors.text }]}>
							{user?.user_metadata?.first_name ? 
								`${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : 
								'Officer'
							}
						</Text>
						<Text style={[styles.drawerSubtitle, { color: colors.textSecondary }]}>
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


