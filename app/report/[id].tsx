import { AudioPlayerModal } from '@/components/audio-player-modal';
import { ImagePreviewModal } from '@/components/image-preview-modal';
import { LocationMapModal } from '@/components/location-map-modal';
import { NavBar } from '@/components/nav-bar';
import { showThemedAlert } from '@/components/ui/themed-alert';
import { useTheme } from '@/contexts/theme-context';
import { downloadAudioToCache } from '@/hooks/use-audio-manager';
import { downloadFile, isFileAlreadyDownloaded, useStoragePermission } from '@/hooks/use-storage-permission';
import { Ionicons } from '@expo/vector-icons';
import { getDispatchClient, useCategories, useOfficers, useReports } from 'dispatch-lib';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function ReportDetailsScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { colors, activeTheme } = useTheme();
	const { getReportInfo } = useReports();
	const { categories } = useCategories();
	const { requestStoragePermission } = useStoragePermission();
	const { officers } = useOfficers();

	const numericId = useMemo(() => {
		const parsed = Number(id);
		return Number.isFinite(parsed) ? parsed : null;
	}, [id]);

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

	const [loading, setLoading] = useState(true);
	const [report, setReport] = useState<any | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showMapModal, setShowMapModal] = useState(false);
	const [attachmentUrls, setAttachmentUrls] = useState<{ [key: string]: string }>({});
	const [downloadingAttachments, setDownloadingAttachments] = useState<Set<string>>(new Set());
	const [previewImage, setPreviewImage] = useState<{ uri: string; filename: string; path: string } | null>(null);
	const [cachedAudioFiles, setCachedAudioFiles] = useState<{ [key: string]: string }>({});
	const [audioPlayerModal, setAudioPlayerModal] = useState<{ visible: boolean; uri: string; filename: string; path: string } | null>(null);
	const [downloadedStatus, setDownloadedStatus] = useState<Set<string>>(new Set());
	const [arrivedLoading, setArrivedLoading] = useState(false);

	useEffect(() => {
		let mounted = true;
		async function fetchReport() {
			if (!numericId) {
				setError('Invalid report id');
				setLoading(false);
				return;
			}
			setLoading(true);
			setError(null);
			try {
				const { data, error } = await getReportInfo(numericId);
				if (!mounted) return;
				if (error) {
					setError(typeof error === 'string' ? error : 'Failed to load report');
					setReport(null);
				} else {
					setReport(data || null);
					console.log('Attachments from report:', data?.attachments);

					if (data?.attachments && data.attachments.length > 0) {
						const dispatchClient = getDispatchClient();
						const urls: { [key: string]: string } = {};
						const audioCache: { [key: string]: string } = {};
						const downloadedSet: Set<string> = new Set();

						for (const attachment of data.attachments) {
							const attachmentStr = typeof attachment === 'string'
								? attachment
								: (attachment as any)?.url || (attachment as any)?.path || '';

							try {
								const { data: signedUrlData } = await dispatchClient.supabaseClient.storage
									.from('attachments')
									.createSignedUrl(attachmentStr, 3600);
								if (signedUrlData?.signedUrl) {
									urls[attachmentStr] = signedUrlData.signedUrl;

									// Auto-download audio files to cache
									const filename = attachmentStr.split('/').pop() || 'audio';
									const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
									const isAudio = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma'].includes(fileExtension);

									if (mounted) {
										if (isAudio) {
											const cachedUri = await downloadAudioToCache(signedUrlData.signedUrl, filename);
											if (cachedUri) {
												audioCache[attachmentStr] = cachedUri;
											}
										}
										// For all attachments, check if already downloaded to the Downloads folder
										const exists = await isFileAlreadyDownloaded(filename);
										if (exists) {
											downloadedSet.add(attachmentStr);
										}
									}
								}
							} catch (err) {
								console.error('Failed to create signed URL for:', attachmentStr, err);
							}
						}

						if (mounted) {
							setAttachmentUrls(urls);
							setCachedAudioFiles(audioCache);
							setDownloadedStatus(downloadedSet);
						}
					}
				}
			} finally {
				if (mounted) setLoading(false);
			}
		}
		fetchReport();
		return () => { mounted = false };
		// IMPORTANT: don't include getReportInfo in deps, it's not stable and will cause refetch loops
	}, [numericId]);

	if (loading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
				<Stack.Screen options={{ title: 'Loading…', headerShown: true }} />
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading report…</Text>
			</View>
		);
	}

	if (!report) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<Stack.Screen options={{ title: 'Report Not Found', headerShown: true }} />
				<View style={styles.errorState}>
					<Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
					<Text style={[styles.errorText, { color: colors.text }]}>{error || 'Report not found'}</Text>
					<TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
						<Text style={styles.backButtonText}>Go Back</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	const latitude = report.latitude ?? report.coordinates?.latitude;
	const longitude = report.longitude ?? report.coordinates?.longitude;
	const isArrivalRecorded = !!report.arrived_at;

	async function openDrivingNavigation(lat: number, lng: number, label?: string) {
		const encodedLabel = encodeURIComponent(label || 'Destination');
		const googleMapsAppUrl = `google.navigation:q=${lat},${lng}`; // Android Google Maps intent
		const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving&destination_place_id=${encodedLabel}`;
		const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
		try {
			if (Platform.OS === 'ios') {
				const canOpenApple = await Linking.canOpenURL('maps://');
				if (canOpenApple) {
					await Linking.openURL(`maps://?daddr=${lat},${lng}&dirflg=d`);
					return;
				}
				await Linking.openURL(appleMapsUrl);
				return;
			}
			const canOpenGoogle = await Linking.canOpenURL(googleMapsAppUrl);
			if (canOpenGoogle) {
				await Linking.openURL(googleMapsAppUrl);
				return;
			}
			await Linking.openURL(googleMapsWebUrl);
		} catch {
			// no-op: let the tap do nothing if maps cannot be opened
		}
	}

	async function handleDownloadImageFromPreview() {
		if (!previewImage) return;

		setDownloadingAttachments(prev => new Set(prev).add(previewImage.path));

		try {
			const hasPermission = await requestStoragePermission();
			if (!hasPermission && Platform.OS !== 'web') {
				return;
			}

			const signedUrl = attachmentUrls[previewImage.path];
			if (!signedUrl) {
				Alert.alert('Error', 'Could not find signed URL for this image.');
				return;
			}

			const success = await downloadFile(signedUrl, previewImage.filename);
			if (success) {
				// Optionally close the preview after successful download
				// setPreviewImage(null);
				setDownloadedStatus(prev => new Set(prev).add(previewImage.path));
			} else {
				Alert.alert('Error', 'Could not download the image.');
			}
		} catch (err) {
			console.error('Error downloading image:', err);
			Alert.alert('Error', 'Could not download the image.');
		} finally {
			setDownloadingAttachments(prev => {
				const next = new Set(prev);
				next.delete(previewImage.path);
				return next;
			});
		}
	}

	async function handleDownloadAudioFromModal() {
		if (!audioPlayerModal) return;

		setDownloadingAttachments(prev => new Set(prev).add(audioPlayerModal.path));

		try {
			const hasPermission = await requestStoragePermission();
			if (!hasPermission && Platform.OS !== 'web') {
				return;
			}

			const signedUrl = attachmentUrls[audioPlayerModal.path];
			if (!signedUrl) {
				Alert.alert('Error', 'Could not find signed URL for this audio.');
				return;
			}

			const success = await downloadFile(signedUrl, audioPlayerModal.filename);
			if (!success) {
				Alert.alert('Error', 'Could not download the audio.');
			} else {
				setDownloadedStatus(prev => new Set(prev).add(audioPlayerModal.path));
			}
		} catch (err) {
			console.error('Error downloading audio:', err);
			Alert.alert('Error', 'Could not download the audio.');
		} finally {
			setDownloadingAttachments(prev => {
				const next = new Set(prev);
				next.delete(audioPlayerModal.path);
				return next;
			});
		}
	}

	async function handleAttachmentPress(attachmentPath: string, filename: string, isImage: boolean, isAudio: boolean) {
		const fileExtension = filename.split('.').pop()?.toLowerCase() || '';

		// For audio files, open the player modal
		if (isAudio) {
			const cachedUri = cachedAudioFiles[attachmentPath];
			if (cachedUri) {
				setAudioPlayerModal({ visible: true, uri: cachedUri, filename, path: attachmentPath });
			} else {
				Alert.alert('Error', 'Could not load audio file.');
			}
			return;
		}

		// For images, show preview instead of downloading
		if (isImage) {
			const signedUrl = attachmentUrls[attachmentPath];
			if (signedUrl) {
				setPreviewImage({ uri: signedUrl, filename, path: attachmentPath });
			} else {
				Alert.alert('Error', 'Could not load image preview.');
			}
			return;
		}

		// For all other files, download to Downloads folder
		setDownloadingAttachments(prev => new Set(prev).add(attachmentPath));

		try {
			const hasPermission = await requestStoragePermission();
			if (!hasPermission && Platform.OS !== 'web') {
				return;
			}

			const signedUrl = attachmentUrls[attachmentPath];
			if (!signedUrl) {
				Alert.alert('Error', 'Could not find signed URL for this attachment.');
				return;
			}

			const success = await downloadFile(signedUrl, filename);
			if (!success) {
				Alert.alert('Error', 'Could not download the file.');
			} else {
				setDownloadedStatus(prev => new Set(prev).add(attachmentPath));
			}
		} catch (err) {
			console.error('Error downloading attachment:', err);
			Alert.alert('Error', 'Could not download the file.');
		} finally {
			setDownloadingAttachments(prev => {
				const next = new Set(prev);
				next.delete(attachmentPath);
				return next;
			});
		}
	}

	async function handleDownloadAttachment(attachmentPath: string, filename: string) {
		setDownloadingAttachments(prev => new Set(prev).add(attachmentPath));

		try {
			const hasPermission = await requestStoragePermission();
			if (!hasPermission && Platform.OS !== 'web') {
				setDownloadingAttachments(prev => {
					const next = new Set(prev);
					next.delete(attachmentPath);
					return next;
				});
				return;
			}

			const signedUrl = attachmentUrls[attachmentPath];
			if (!signedUrl) {
				Alert.alert('Error', 'Could not find signed URL for this attachment.');
				setDownloadingAttachments(prev => {
					const next = new Set(prev);
					next.delete(attachmentPath);
					return next;
				});
				return;
			}

			const success = await downloadFile(signedUrl, filename);
			if (!success) {
				console.log('File download failed or was cancelled');
			} else {
				setDownloadedStatus(prev => new Set(prev).add(attachmentPath));
			}

		} catch (err) {
			console.error('Download error:', err);
			Alert.alert('Download Failed', 'An error occurred while downloading the file.');
		} finally {
			setDownloadingAttachments(prev => {
				const next = new Set(prev);
				next.delete(attachmentPath);
				return next;
			});
		}
	}

	async function handleArrived() {
		if (!report || arrivedLoading || isArrivalRecorded) {
			return;
		}

		const reportId = Number(report.id ?? numericId);
		if (!Number.isFinite(reportId)) {
			showThemedAlert({
				title: 'Arrival Failed',
				message: 'Invalid report id.',
				variant: 'error',
			});
			return;
		}

		setArrivedLoading(true);
		try {
			const dispatchClient = getDispatchClient();
			const { data, error } = await dispatchClient.officerArrived(reportId);

			if (error) {
				showThemedAlert({
					title: 'Arrival Failed',
					message: error,
					variant: 'error',
				});
				return;
			}

			if (data?.arrived_at) {
				setReport((prev: any) => prev ? { ...prev, arrived_at: data.arrived_at } : prev);
				showThemedAlert({
					title: 'Arrival Recorded',
					message: 'Arrival time has been logged for this report.',
					variant: 'success',
				});
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
			showThemedAlert({
				title: 'Arrival Failed',
				message,
				variant: 'error',
			});
		} finally {
			setArrivedLoading(false);
		}
	}

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
			<Stack.Screen options={{ headerShown: false }} />

			{/* Navigation Bar */}
			<NavBar
				title="Report Details"
				leftIcon="arrow-back"
				onLeftPress={() => router.back()}
				showLeftIcon={true}
				showRightIcon={false}
			/>

			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
				{/* Report Header */}
				<View style={[styles.headerSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
					<Text style={[styles.reportTitle, { color: colors.text }]}>{report.incident_title || `Report #${report.id}`}</Text>
					<View style={styles.statusBadge}>
						<Text style={styles.statusText}>{(report.status || 'pending').toString()}</Text>
					</View>

					{/* Description */}
					<Text style={[styles.descriptionText, { color: colors.text, marginTop: 12 }]}>{report.what_happened || report.brief_description || 'No description provided'}</Text>
				</View>

				{/* Reporter ID hidden per request */}

				{/* Date & Time */}
				<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
					<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Date & Time</Text>
					<View style={styles.infoRow}>
						<Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
						<Text style={[styles.infoText, { color: colors.text }]}>
							{(report.incident_date || report.created_at || '—')}{report.incident_time ? ` at ${report.incident_time}` : ''}
						</Text>
					</View>
				</View>

				{/* Location */}
				<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
					<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Location</Text>

					{/* Embedded Map */}
					{(latitude != null && longitude != null) ? (
						<View style={styles.mapContainer}>
							<MapView
								provider={PROVIDER_GOOGLE}
								style={styles.embeddedMap}
								customMapStyle={activeTheme === 'dark' ? darkMapStyle : []}
								initialRegion={{
									latitude: Number(latitude),
									longitude: Number(longitude),
									latitudeDelta: 0.01,
									longitudeDelta: 0.01,
								}}
								scrollEnabled={false}
								zoomEnabled={false}
								rotateEnabled={false}
								pitchEnabled={false}
							>
								<Marker
									coordinate={{
										latitude: Number(latitude),
										longitude: Number(longitude),
									}}
									title={report.incident_title || `Report #${report.id}`}
									description={report.street_address || ''}
								>
									<View style={styles.incidentMarker}>
										<Ionicons name="location" color="#DC2626" size={28} />
									</View>
								</Marker>
							</MapView>

							{/* Map Overlay with Actions */}
							<TouchableOpacity
								style={styles.mapOverlayButton}
								onPress={() => setShowMapModal(true)}
								activeOpacity={0.9}
							>
								<View style={styles.mapExpandButton}>
									<Ionicons name="expand" size={18} color="#FFFFFF" />
									<Text style={styles.mapExpandText}>View Full Map</Text>
								</View>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.mapNavigateButton}
								onPress={() => openDrivingNavigation(Number(latitude), Number(longitude), report.incident_title || `Report #${report.id}`)}
								activeOpacity={0.9}
							>
								<View style={styles.navigateButtonInner}>
									<Ionicons name="navigate" size={18} color="#FFFFFF" />
									<Text style={styles.navigateButtonText}>Navigate</Text>
								</View>
							</TouchableOpacity>
						</View>
					) : (
						<View style={[styles.mapPreview, { justifyContent: 'center', alignItems: 'center' }]}>
							<Text style={{ color: colors.textSecondary }}>No coordinates available</Text>
						</View>
					)}

					{/* Location Details */}
					<View style={[styles.locationDetailsCard, { backgroundColor: colors.background }]}>
						<View style={styles.infoRow}>
							<Ionicons name="location-outline" size={18} color={colors.textSecondary} />
							<View style={{ flex: 1 }}>
								<Text style={[styles.infoText, { color: colors.text }]}>{report.street_address || '—'}</Text>
								<Text style={[styles.infoTextSecondary, { color: colors.textSecondary }]}>
									{(report.city || '').toString()}{report.province ? `, ${report.province}` : ''}
								</Text>
								{report.nearby_landmark && (
									<Text style={[styles.infoTextSecondary, { color: colors.textSecondary }]}>Near: {report.nearby_landmark}</Text>
								)}
								{(latitude != null && longitude != null) && (
									<Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
										{Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
									</Text>
								)}
							</View>
						</View>
					</View>
				</View>

				{/* Category */}
				<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
					<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Category</Text>
					<View style={styles.categoryBadge}>
						<Text style={styles.categoryText}>
							{(() => {
								const category = categories?.find((cat: any) => cat.id === report.category_id);
								return category?.name || report.category || 'Uncategorized';
							})()}
						</Text>
					</View>
				</View>



				{/* Involved Parties */}
				{report.who_was_involved && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Who Was Involved</Text>
						<Text style={[styles.sectionValue, { color: colors.text }]}>{report.who_was_involved}</Text>
					</View>
				)}

				{/* Witnesses */}
				{report.number_of_witnesses && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Number of Witnesses</Text>
						<Text style={[styles.sectionValue, { color: colors.text }]}>{report.number_of_witnesses}</Text>
					</View>
				)}

				{/* Injuries */}
				{report.injuries_reported && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Injuries Reported</Text>
						<Text style={[styles.sectionValue, { color: colors.text }]}>{report.injuries_reported}</Text>
					</View>
				)}

				{/* Property Damage */}
				{report.property_damage && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Property Damage</Text>
						<Text style={[styles.sectionValue, { color: colors.text }]}>{report.property_damage}</Text>
					</View>
				)}

				{/* Vehicle Description */}
				{report.vehicle_description && report.vehicle_description !== 'None' && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Vehicle Description</Text>
						<Text style={[styles.sectionValue, { color: colors.text }]}>{report.vehicle_description}</Text>
					</View>
				)}

				{/* Suspect Description */}
				{report.suspect_description && report.suspect_description !== 'N/A' && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Suspect Description</Text>
						<Text style={[styles.sectionValue, { color: colors.text }]}>{report.suspect_description}</Text>
					</View>
				)}

				{/* Witness Contact Info */}
				{report.witness_contact_info && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Witness Contact Information</Text>
						<Text style={[styles.sectionValue, { color: colors.text }]}>{report.witness_contact_info}</Text>
					</View>
				)}

				{/* Officers Involved */}
				{report.officers_involved && report.officers_involved.length > 0 && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Officers Involved</Text>
						{report.officers_involved.map((officerId: string | number, index: number) => (
							<Text key={index} style={[styles.sectionValue, { color: colors.text }]}>
								{getOfficerName(officerId)}
							</Text>
						))}
					</View>
				)}

				{/* Arrived Button */}
				<TouchableOpacity
					style={[
						styles.arrivedButton,
						{
							backgroundColor: isArrivalRecorded ? colors.success : colors.primary,
							opacity: (arrivedLoading || isArrivalRecorded) ? 0.7 : 1,
						},
					]}
					onPress={handleArrived}
					disabled={arrivedLoading || isArrivalRecorded}
				>
					{arrivedLoading ? (
						<ActivityIndicator size="small" color="#FFFFFF" />
					) : (
						<View style={styles.arrivedButtonContent}>
							{isArrivalRecorded && (
								<Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
							)}
							<Text style={styles.arrivedButtonText}>Arrived</Text>
						</View>
					)}
				</TouchableOpacity>

				{/* Resolved Date hidden per request */}

				{/* Attachments */}
				{report.attachments && report.attachments.length > 0 && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Attachments</Text>
						<View style={styles.attachmentsContainer}>
							{report.attachments.map((attachment: any, index: number) => {
								const attachmentStr = typeof attachment === 'string'
									? attachment
									: (attachment as any)?.url || (attachment as any)?.path || '';
								const filename = attachmentStr.split('/').pop() || `Attachment ${index + 1}`;
								const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
								const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
								const isAudio = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma'].includes(fileExtension);
								const signedUrl = attachmentUrls[attachmentStr];
								const cachedAudioUri = cachedAudioFiles[attachmentStr];
								const isDownloaded = downloadedStatus.has(attachmentStr);

								const getFileIcon = (ext: string) => {
									if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image-outline';
									if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'videocam-outline';
									if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma'].includes(ext)) return 'musical-notes-outline';
									if (['pdf'].includes(ext)) return 'document-text-outline';
									return 'document-outline';
								};
								const getFileType = (ext: string) => {
									if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'Image';
									if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'Video';
									if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma'].includes(ext)) return 'Audio';
									if (['pdf'].includes(ext)) return 'PDF';
									return ext.toUpperCase() || 'File';
								};

								// Render audio as attachment list item (not inline player)
								return (
									<View key={index} style={[styles.attachmentItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
										<TouchableOpacity
											onPress={() => handleAttachmentPress(attachmentStr, filename, isImage, isAudio)}
											style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
											disabled={downloadingAttachments.has(attachmentStr)}
										>
											{isImage && signedUrl ? (
												<Image
													source={{ uri: signedUrl }}
													style={styles.attachmentThumbnail}
												/>
											) : (
												<Ionicons name={getFileIcon(fileExtension)} size={20} color={colors.primary} />
											)}
											<View style={styles.attachmentInfo}>
												<Text style={[styles.attachmentName, { color: colors.text }]}>
													{filename}
												</Text>
												<Text style={[styles.attachmentType, { color: colors.textSecondary }]}>
													{getFileType(fileExtension)}
												</Text>
											</View>
										</TouchableOpacity>
										{(
											<TouchableOpacity
												onPress={() => handleDownloadAttachment(attachmentStr, filename)}
												disabled={downloadingAttachments.has(attachmentStr) || isDownloaded}
												style={{ opacity: (downloadingAttachments.has(attachmentStr) || isDownloaded) ? 0.5 : 1 }}
											>
												{downloadingAttachments.has(attachmentStr) ? (
													<ActivityIndicator size="small" color={colors.primary} />
												) : isDownloaded ? (
													<Ionicons name="checkmark-done-outline" size={20} color={colors.primary} />
												) : (
													<Ionicons name="download-outline" size={20} color={colors.primary} />
												)}
											</TouchableOpacity>
										)}
									</View>
								);
							})}
						</View>
					</View>
				)}

				{/* Additional Info */}
				{report.additional_info && (
					<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
						<Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Additional Information</Text>
						<Text style={[styles.sectionValue, { color: colors.text }]}>{report.additional_info}</Text>
					</View>
				)}




			</ScrollView>

			{/* Audio Player Modal */}
			{audioPlayerModal && (
				<AudioPlayerModal
					visible={audioPlayerModal.visible}
					uri={audioPlayerModal.uri}
					filename={audioPlayerModal.filename}
					onClose={() => setAudioPlayerModal(null)}
					onDownload={handleDownloadAudioFromModal}
					isDownloading={downloadingAttachments.has(audioPlayerModal.path)}
					colors={colors}
					backdropColor={activeTheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)'}
				/>
			)}

			{/* Location Map Modal */}
			{(latitude != null && longitude != null) && (
				<LocationMapModal
					visible={showMapModal}
					onClose={() => setShowMapModal(false)}
					incidentLocation={{
						latitude: Number(latitude),
						longitude: Number(longitude),
						title: report.incident_title || `Report #${report.id}`,
						address: `${report.street_address || ''}${report.city ? `, ${report.city}` : ''}${report.province ? `, ${report.province}` : ''}`,
					}}
				/>
			)}

			{/* Image Preview Modal */}
			{previewImage && (
				<ImagePreviewModal
					visible={!!previewImage}
					imageUri={previewImage.uri}
					filename={previewImage.filename}
					onClose={() => setPreviewImage(null)}
					onDownload={handleDownloadImageFromPreview}
					isDownloading={downloadingAttachments.has(previewImage.path)}
					colors={colors}
					backdropColor={activeTheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)'}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
	},
	headerSection: {
		borderRadius: 12,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
	},
	reportTitle: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 12,
	},
	statusBadge: {
		alignSelf: 'flex-start',
		backgroundColor: '#DBEAFE',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
	},
	statusText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1E40AF',
	},
	section: {
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
	},
	sectionLabel: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase',
		marginBottom: 8,
		letterSpacing: 0.5,
	},
	sectionValue: {
		fontSize: 16,
		lineHeight: 24,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
	},
	locationContainer: {
		flexDirection: 'row',
		gap: 12,
		alignItems: 'flex-start',
	},
	mapContainer: {
		width: '100%',
		height: 250,
		borderRadius: 12,
		overflow: 'hidden',
		marginBottom: 12,
		position: 'relative',
	},
	embeddedMap: {
		width: '100%',
		height: '100%',
	},
	mapOverlayButton: {
		position: 'absolute',
		top: 12,
		right: 12,
	},
	mapNavigateButton: {
		position: 'absolute',
		bottom: 12,
		right: 12,
	},
	navigateButtonInner: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#3B82F6',
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 8,
		gap: 6,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	navigateButtonText: {
		color: '#FFFFFF',
		fontSize: 13,
		fontWeight: '600',
	},
	incidentMarker: {
		width: 32,
		height: 32,
		backgroundColor: 'transparent',
		alignItems: 'center',
		justifyContent: 'center',
	},
	mapPreview: {
		width: '100%',
		height: 200,
		borderRadius: 12,
		overflow: 'hidden',
		marginBottom: 12,
		backgroundColor: '#F3F4F6',
		position: 'relative',
	},
	mapPreviewImage: {
		width: '100%',
		height: '100%',
	},
	mapPlaceholder: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#EFF6FF',
		borderWidth: 2,
		borderColor: '#BFDBFE',
		borderStyle: 'dashed',
	},
	mapPlaceholderTitle: {
		fontSize: 18,
		fontWeight: '700',
		marginTop: 12,
	},
	mapPlaceholderText: {
		fontSize: 13,
		marginTop: 6,
		fontFamily: 'monospace',
	},
	mapPlaceholderSubtext: {
		fontSize: 12,
		color: '#9CA3AF',
		marginTop: 4,
	},
	mapPreviewOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.15)',
		justifyContent: 'flex-end',
		padding: 12,
	},
	mapExpandButton: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-end',
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		gap: 6,
	},
	mapExpandText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '600',
	},
	locationDetailsCard: {
		padding: 12,
		borderRadius: 8,
	},
	mapThumbnail: {
		width: 120,
		height: 120,
		borderRadius: 12,
		overflow: 'hidden',
		position: 'relative',
	},
	mapImage: {
		width: '100%',
		height: '100%',
		backgroundColor: '#F3F4F6',
	},
	mapOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	infoText: {
		fontSize: 16,
	},
	infoTextSecondary: {
		fontSize: 14,
		marginTop: 2,
	},
	coordinatesText: {
		fontSize: 12,
		marginTop: 4,
		fontFamily: 'monospace',
	},
	categoryBadge: {
		alignSelf: 'flex-start',
		backgroundColor: '#FEF3C7',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	categoryText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#92400E',
	},
	descriptionText: {
		fontSize: 16,
		lineHeight: 24,
	},
	attachmentsContainer: {
		gap: 8,
	},
	attachmentItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		gap: 12,
	},
	attachmentInfo: {
		flex: 1,
	},
	attachmentName: {
		fontSize: 16,
		fontWeight: '500',
	},
	attachmentType: {
		fontSize: 14,
		marginTop: 2,
	},
	attachmentThumbnail: {
		width: 48,
		height: 48,
		borderRadius: 6,
		backgroundColor: '#F3F4F6',
	},
	actionButtons: {
		marginTop: 16,
		marginBottom: 32,
		gap: 12,
	},
	primaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
		paddingVertical: 16,
		gap: 8,
	},
	primaryButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	secondaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderRadius: 12,
		paddingVertical: 16,
		gap: 8,
	},
	secondaryButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	arrivedButton: {
		marginTop: 16,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	arrivedButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	arrivedButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	errorState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 40,
	},
	errorText: {
		fontSize: 18,
		marginTop: 16,
		marginBottom: 24,
	},
	backButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	backButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
	},
});
