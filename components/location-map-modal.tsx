import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

interface LocationMapModalProps {
	visible: boolean;
	onClose: () => void;
	incidentLocation: {
		latitude: number;
		longitude: number;
		title: string;
		address: string;
	};
}

export function LocationMapModal({ visible, onClose, incidentLocation }: LocationMapModalProps) {
	const { colors, activeTheme } = useTheme();
	const mapRef = useRef<MapView>(null);
	const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);

	useEffect(() => {
		let mounted = true;
		async function ensurePermission() {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (!mounted) return;
				setHasLocationPermission(status === 'granted');
				if (status !== 'granted') {
					Alert.alert('Permission needed', 'Location permission is required to show your current position.');
				}
			} catch (e) {
				// ignore
			}
		}
		if (visible) ensurePermission();
		return () => { mounted = false };
	}, [visible]);

	return (
		<Modal visible={visible} animationType="slide" onRequestClose={onClose}>
			<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
				{/* Header */}
				<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
					<Text style={[styles.headerTitle, { color: colors.text }]}>Incident Location</Text>
					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<Ionicons name="close" size={24} color={colors.text} />
					</TouchableOpacity>
				</View>

				{/* Map */}
				<MapView
					ref={mapRef}
					provider={PROVIDER_GOOGLE}
					style={styles.map}
					customMapStyle={activeTheme === 'dark' ? darkMapStyle : []}
					initialRegion={{
						latitude: incidentLocation.latitude,
						longitude: incidentLocation.longitude,
						latitudeDelta: 0.01,
						longitudeDelta: 0.01,
					}}
					showsUserLocation={hasLocationPermission}
					showsMyLocationButton={hasLocationPermission}
					showsTraffic={false}
				>
					{/* Incident Marker */}
					<Marker
						coordinate={{
							latitude: incidentLocation.latitude,
							longitude: incidentLocation.longitude,
						}}
						title={incidentLocation.title}
						description={incidentLocation.address}
					>
						<View style={styles.incidentMarker}>
							<Ionicons name="location" color="#DC2626" size={28} />
						</View>
					</Marker>
				</MapView>

				{/* Location Info */}
				<View style={[styles.infoCard, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
					<View style={styles.infoRow}>
						<Ionicons name="location" size={20} color="#EF4444" />
						<View style={{ flex: 1 }}>
							<Text style={[styles.infoTitle, { color: colors.text }]}>{incidentLocation.title}</Text>
							<Text style={[styles.infoAddress, { color: colors.textSecondary }]}>{incidentLocation.address}</Text>
							<Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
								{incidentLocation.latitude.toFixed(6)}, {incidentLocation.longitude.toFixed(6)}
							</Text>
						</View>
					</View>
				</View>
			</SafeAreaView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		height: 60,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		borderBottomWidth: 1,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '700',
	},
	closeButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
	},
	map: {
		flex: 1,
	},
	infoCard: {
		borderTopWidth: 1,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
	},
	infoAddress: {
		fontSize: 14,
		lineHeight: 20,
	},
	incidentMarker: {
		width: 32,
		height: 32,
		backgroundColor: 'transparent',
		alignItems: 'center',
		justifyContent: 'center',
	},
	coordinatesText: {
		fontSize: 12,
		marginTop: 4,
		fontFamily: 'monospace',
	},
});
