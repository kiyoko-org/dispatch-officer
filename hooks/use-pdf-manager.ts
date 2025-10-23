import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

/**
 * Downloads a PDF to the app cache and returns the local URI
 */
export async function downloadPdfToCache(signedUrl: string, filename: string): Promise<string | null> {
  try {
    const dir = `${FileSystem.cacheDirectory}pdf/`;
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    const fileUri = `${dir}${filename.endsWith('.pdf') ? filename : `${filename}.pdf`}`;
    const { uri } = await FileSystem.downloadAsync(signedUrl, fileUri);
    return uri || fileUri;
  } catch (err) {
    console.error('downloadPdfToCache error:', err);
    Alert.alert('Download Failed', 'Could not download the PDF.');
    return null;
  }
}

/**
 * Opens a local PDF with the system share/viewer sheet when available
 */
export async function openPdfWithViewer(fileUri: string): Promise<void> {
  try {
    // Prefer the system share sheet which typically offers compatible viewers
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
      });
      return;
    }

    // As a fallback, attempt to use the platform-specific intents if available
    if (Platform.OS === 'android') {
      // Intent-based open can be added here if needed; sharing is usually sufficient
      Alert.alert('Open PDF', 'Sharing is unavailable on this device. Please open the file from a PDF-capable app.');
    } else if (Platform.OS === 'ios') {
      Alert.alert('Open PDF', 'Sharing is unavailable on this device. Please open the file from the Files app.');
    }
  } catch (err) {
    console.error('openPdfWithViewer error:', err);
    Alert.alert('Open Failed', 'Could not open the PDF.');
  }
}
