import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

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
	const [officerLocation, setOfficerLocation] = useState<{ latitude: number; longitude: number } | null>(null);

	useEffect(() => {
		if (visible) {
			getCurrentLocation();
		}
	}, [visible]);

	async function getCurrentLocation() {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				console.log('Permission to access location was denied');
				return;
			}

			const location = await Location.getCurrentPositionAsync({});
			setOfficerLocation({
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			});
		} catch (error) {
			console.error('Error getting location:', error);
		}
	}

	return (
		<Modal visible={visible} animationType="slide" onRequestClose={onClose}>
			<SafeAreaView style={styles.container} edges={['top']}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Incident Location</Text>
					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<Ionicons name="close" size={24} color="#111827" />
					</TouchableOpacity>
				</View>

				{/* Map */}
				<MapView
					provider={PROVIDER_GOOGLE}
					style={styles.map}
					initialRegion={{
						latitude: incidentLocation.latitude,
						longitude: incidentLocation.longitude,
						latitudeDelta: 0.01,
						longitudeDelta: 0.01,
					}}
					showsUserLocation={true}
					showsMyLocationButton={true}
				>
					{/* Incident Marker */}
					<Marker
						coordinate={{
							latitude: incidentLocation.latitude,
							longitude: incidentLocation.longitude,
						}}
						title={incidentLocation.title}
						description={incidentLocation.address}
						pinColor="#EF4444"
					/>

					{/* Officer Location Marker */}
					{officerLocation && (
						<Marker
							coordinate={officerLocation}
							title="Your Location"
							description="Officer Position"
							pinColor="#3B82F6"
						/>
					)}
				</MapView>

				{/* Location Info */}
				<View style={styles.infoCard}>
					<View style={styles.infoRow}>
						<Ionicons name="location" size={20} color="#EF4444" />
						<View style={{ flex: 1 }}>
							<Text style={styles.infoTitle}>Incident Location</Text>
							<Text style={styles.infoAddress}>{incidentLocation.address}</Text>
						</View>
					</View>
					
					{officerLocation && (
						<View style={[styles.infoRow, { marginTop: 12 }]}>
							<Ionicons name="person" size={20} color="#3B82F6" />
							<View style={{ flex: 1 }}>
								<Text style={styles.infoTitle}>Your Location</Text>
								<Text style={styles.infoAddress}>
									{officerLocation.latitude.toFixed(6)}, {officerLocation.longitude.toFixed(6)}
								</Text>
							</View>
						</View>
					)}
				</View>
			</SafeAreaView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	header: {
		height: 60,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
		backgroundColor: '#FFFFFF',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111827',
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
		backgroundColor: '#FFFFFF',
		borderTopWidth: 1,
		borderTopColor: '#E5E7EB',
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
		color: '#111827',
		marginBottom: 4,
	},
	infoAddress: {
		fontSize: 14,
		color: '#6B7280',
		lineHeight: 20,
	},
});
