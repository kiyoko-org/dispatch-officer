import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useEffect, useState, useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Alert, Linking, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
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
	const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
	const [distance, setDistance] = useState<string>('');
	const [duration, setDuration] = useState<string>('');
	const [routingMethod, setRoutingMethod] = useState<'google' | 'osrm' | 'direct'>('google');
	const mapRef = useRef<MapView>(null);

	useEffect(() => {
		if (visible) {
			getCurrentLocation();
		}
	}, [visible]);

	useEffect(() => {
		if (officerLocation && visible) {
			getDirections();
		}
	}, [officerLocation, visible, routingMethod]);

	async function getCurrentLocation() {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permission Denied', 'Location permission is required to show your position and route.');
				return;
			}

			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});
			setOfficerLocation({
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			});
		} catch (error) {
			console.error('Error getting location:', error);
			Alert.alert('Error', 'Could not get your current location.');
		}
	}

	async function getDirections() {
		if (!officerLocation) return;

		try {
			if (routingMethod === 'google') {
				await getGoogleDirections();
			} else if (routingMethod === 'osrm') {
				await getOSRMDirections();
			} else {
				getDirectRoute();
			}
		} catch (error) {
			console.error('Error getting directions:', error);
			Alert.alert('Error', 'Failed to get route directions.');
		}
	}

	async function getGoogleDirections() {
		if (!officerLocation) return;

		const origin = `${officerLocation.latitude},${officerLocation.longitude}`;
		const destination = `${incidentLocation.latitude},${incidentLocation.longitude}`;
		const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;
		
		console.log('API Key from config:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
		
		if (!apiKey) {
			console.error('Google Maps API key not found, falling back to OSRM');
			setRoutingMethod('osrm');
			return;
		}
		
		const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${apiKey}`;
		console.log('Fetching directions from:', url.replace(apiKey, 'API_KEY_HIDDEN'));
		
		// Using Google Directions API
		const response = await fetch(url);
		const data = await response.json();

		console.log('Directions API response status:', data.status);

		if (data.status === 'REQUEST_DENIED') {
			console.error('API request denied, falling back to OSRM');
			setRoutingMethod('osrm');
			return;
		}

		if (data.status !== 'OK') {
			console.error('Directions API error:', data.status);
			setRoutingMethod('osrm');
			return;
		}

		if (data.routes && data.routes.length > 0) {
			const route = data.routes[0];
			const points = decodePolyline(route.overview_polyline.points);
			console.log(`Google route found with ${points.length} points`);
			setRouteCoordinates(points);
			
			// Set distance and duration
			if (route.legs && route.legs.length > 0) {
				setDistance(route.legs[0].distance.text);
				setDuration(route.legs[0].duration.text);
			}

			// Fit map to show both markers and route
			if (mapRef.current) {
				mapRef.current.fitToCoordinates([officerLocation, incidentLocation], {
					edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
					animated: true,
				});
			}
		} else {
			console.log('No Google routes found, falling back to OSRM');
			setRoutingMethod('osrm');
		}
	}

	async function getOSRMDirections() {
		if (!officerLocation) return;

		try {
			// Using OSRM (OpenStreetMap Routing Machine) - Free alternative
			const response = await fetch(
				`https://router.project-osrm.org/route/v1/driving/${officerLocation.longitude},${officerLocation.latitude};${incidentLocation.longitude},${incidentLocation.latitude}?overview=full&geometries=polyline`
			);
			const data = await response.json();

			console.log('OSRM API response:', data);

			if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
				const route = data.routes[0];
				const points = decodePolyline(route.geometry);
				console.log(`OSRM route found with ${points.length} points`);
				setRouteCoordinates(points);
				
				// Set distance and duration (OSRM returns in meters and seconds)
				const distanceKm = (route.distance / 1000).toFixed(1);
				const durationMin = Math.round(route.duration / 60);
				setDistance(`${distanceKm} km`);
				setDuration(`${durationMin} min`);

				// Fit map to show both markers and route
				if (mapRef.current) {
					mapRef.current.fitToCoordinates([officerLocation, incidentLocation], {
						edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
						animated: true,
					});
				}
			} else {
				console.log('No OSRM routes found, using direct route');
				getDirectRoute();
			}
		} catch (error) {
			console.error('OSRM routing failed, using direct route:', error);
			getDirectRoute();
		}
	}

	function getDirectRoute() {
		if (!officerLocation) return;

		// Simple straight line route
		const route = [officerLocation, incidentLocation];
		setRouteCoordinates(route);
		
		// Calculate straight-line distance
		const distance = calculateDistance(
			officerLocation.latitude,
			officerLocation.longitude,
			incidentLocation.latitude,
			incidentLocation.longitude
		);
		setDistance(`${distance.toFixed(1)} km (direct)`);
		setDuration('~ estimated');

		// Fit map to show both markers
		if (mapRef.current) {
			mapRef.current.fitToCoordinates([officerLocation, incidentLocation], {
				edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
				animated: true,
			});
		}
	}

	function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		// Haversine formula for calculating distance between two coordinates
		const R = 6371; // Earth's radius in km
		const dLat = toRad(lat2 - lat1);
		const dLon = toRad(lon2 - lon1);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
			Math.sin(dLon / 2) * Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	function toRad(degrees: number): number {
		return degrees * (Math.PI / 180);
	}

	async function openInGoogleMaps() {
		if (!officerLocation) {
			Alert.alert('Error', 'Your location is not available yet.');
			return;
		}

		const origin = `${officerLocation.latitude},${officerLocation.longitude}`;
		const destination = `${incidentLocation.latitude},${incidentLocation.longitude}`;
		
		// Google Maps URL with driving directions
		const url = Platform.select({
			ios: `comgooglemaps://?saddr=${origin}&daddr=${destination}&directionsmode=driving`,
			android: `google.navigation:q=${destination}&mode=d`,
		});

		const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

		try {
			const supported = await Linking.canOpenURL(url!);
			if (supported) {
				await Linking.openURL(url!);
			} else {
				// Fallback to web browser if Google Maps app is not installed
				await Linking.openURL(fallbackUrl);
			}
		} catch (error) {
			console.error('Error opening Google Maps:', error);
			Alert.alert('Error', 'Could not open Google Maps.');
		}
	}

	// Decode polyline from Google Directions API
	function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
		const poly = [];
		let index = 0, len = encoded.length;
		let lat = 0, lng = 0;

		while (index < len) {
			let b, shift = 0, result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
			lat += dlat;

			shift = 0;
			result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
			lng += dlng;

			poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
		}
		return poly;
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
					ref={mapRef}
					provider={PROVIDER_GOOGLE}
					style={styles.map}
					initialRegion={{
						latitude: incidentLocation.latitude,
						longitude: incidentLocation.longitude,
						latitudeDelta: 0.05,
						longitudeDelta: 0.05,
					}}
					showsUserLocation={true}
					showsMyLocationButton={true}
					showsTraffic={true}
				>
					{/* Route Polyline */}
					{routeCoordinates.length > 0 && (
						<Polyline
							coordinates={routeCoordinates}
							strokeColor="#2563EB"
							strokeWidth={6}
							lineCap="round"
							lineJoin="round"
						/>
					)}

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
							<Ionicons name="alert-circle" size={30} color="#FFFFFF" />
						</View>
					</Marker>

					{/* Officer Location Marker */}
					{officerLocation && (
						<Marker
							coordinate={officerLocation}
							title="Your Location"
							description="Officer Position"
						>
							<View style={styles.officerMarker}>
								<Ionicons name="person" size={24} color="#FFFFFF" />
							</View>
						</Marker>
					)}
				</MapView>

				{/* Location Info */}
				<View style={styles.infoCard}>
					{/* Routing Method Selector */}
					<View style={styles.routingSelector}>
						<TouchableOpacity
							style={[styles.routingButton, routingMethod === 'google' && styles.routingButtonActive]}
							onPress={() => setRoutingMethod('google')}
							activeOpacity={0.7}
						>
							<Text style={[styles.routingButtonText, routingMethod === 'google' && styles.routingButtonTextActive]}>
								Google
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.routingButton, routingMethod === 'osrm' && styles.routingButtonActive]}
							onPress={() => setRoutingMethod('osrm')}
							activeOpacity={0.7}
						>
							<Text style={[styles.routingButtonText, routingMethod === 'osrm' && styles.routingButtonTextActive]}>
								OSRM
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.routingButton, routingMethod === 'direct' && styles.routingButtonActive]}
							onPress={() => setRoutingMethod('direct')}
							activeOpacity={0.7}
						>
							<Text style={[styles.routingButtonText, routingMethod === 'direct' && styles.routingButtonTextActive]}>
								Direct
							</Text>
						</TouchableOpacity>
					</View>

					{distance && duration && (
						<>
							<View style={[styles.infoRow, { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }]}>
								<Ionicons name="car" size={20} color="#3B82F6" />
								<View style={{ flex: 1 }}>
									<Text style={styles.infoTitle}>Route Information</Text>
									<Text style={styles.infoAddress}>Distance: {distance} • ETA: {duration}</Text>
								</View>
							</View>

							{/* Navigate Button */}
							<TouchableOpacity 
								style={styles.navigateButton}
								onPress={openInGoogleMaps}
								activeOpacity={0.8}
							>
								<Ionicons name="navigate" size={20} color="#FFFFFF" />
								<Text style={styles.navigateButtonText}>Start Navigation in Google Maps</Text>
							</TouchableOpacity>
						</>
					)}
					
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
	incidentMarker: {
		width: 40,
		height: 40,
		backgroundColor: '#EF4444',
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3,
		borderColor: '#FFFFFF',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	officerMarker: {
		width: 36,
		height: 36,
		backgroundColor: '#3B82F6',
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3,
		borderColor: '#FFFFFF',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	navigateButton: {
		backgroundColor: '#2563EB',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 12,
		marginBottom: 12,
		gap: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	navigateButtonText: {
		color: '#FFFFFF',
		fontSize: 15,
		fontWeight: '600',
	},
	routingSelector: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 16,
		padding: 4,
		backgroundColor: '#F3F4F6',
		borderRadius: 10,
	},
	routingButton: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	routingButtonActive: {
		backgroundColor: '#2563EB',
	},
	routingButtonText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#6B7280',
	},
	routingButtonTextActive: {
		color: '#FFFFFF',
	},
});
