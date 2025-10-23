import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import { showThemedAlert } from '@/components/ui/themed-alert';

export const useStoragePermission = () => {
  const requestStoragePermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error requesting storage permission:', error);
      return false;
    }
  };

  return { requestStoragePermission };
};

/**
 * Returns the platform-specific download directory used by this app.
 */
export const getDownloadDirectory = (): string => {
  if (Platform.OS === 'android') {
    return 'file:///sdcard/Download/';
  } else if (Platform.OS === 'ios') {
    // iOS Documents folder (visible in Files app)
    return `${FileSystem.documentDirectory}Downloads/`;
  }
  return `${FileSystem.documentDirectory}Downloads/`;
};

/**
 * Builds the target file URI in the Downloads folder for a given filename.
 */
export const getDownloadedFileUri = (filename: string): string => {
  const dir = getDownloadDirectory();
  return `${dir}${filename}`;
};

/**
 * Checks if a file with the given filename already exists in the Downloads folder.
 */
export const isFileAlreadyDownloaded = async (filename: string): Promise<boolean> => {
  try {
    const fileUri = getDownloadedFileUri(filename);
    const info = await FileSystem.getInfoAsync(fileUri);
    return !!info.exists;
  } catch (e) {
    return false;
  }
};

/**
 * Downloads a file from a signed URL and stores it in the phone's Downloads folder
 * @param signedUrl - The signed URL to download from
 * @param filename - The filename to save as
 * @returns true if successful, false otherwise
 */
export const downloadFile = async (signedUrl: string, filename: string): Promise<boolean> => {
  try {
    const downloadDir = getDownloadDirectory();

    // Ensure the download directory exists (especially important on iOS)
    const dirInfo = await FileSystem.getInfoAsync(downloadDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
    }

    const filePath = `${downloadDir}${filename}`;

    // Prevent duplicate downloads: if file already exists, inform the user and stop
    const existing = await FileSystem.getInfoAsync(filePath);
    if (existing.exists) {
      showThemedAlert({
        title: 'Already downloaded',
        message: `This file is already in your Downloads folder as:\n${filename}`,
        variant: 'info',
      });
      return true;
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      signedUrl,
      filePath,
      {}
    );

    const result = await downloadResumable.downloadAsync();
    
    if (!result || !result.uri) {
      throw new Error('Download failed');
    }

    console.log('File downloaded to:', result.uri);
    showThemedAlert({
      title: 'Download complete',
      message: `Saved to Downloads: ${filename}`,
      variant: 'success',
    });
    return true;
  } catch (error) {
    console.error('Download error:', error);
    showThemedAlert({
      title: 'Download failed',
      message: 'Could not download the file. Please try again.',
      variant: 'error',
    });
    return false;
  }
};

/**
 * Opens a file with the appropriate system app
 * For Android, this requires the file to be in a location accessible to other apps
 * @param fileUri - The file URI to open
 * @param mimeType - The MIME type of the file
 */
export const openFileWithExternalApp = async (fileUri: string, mimeType: string): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await IntentLauncher.startActivityAsync('com.apple.UIKit.activity.Open', {
        data: fileUri,
        flags: 1,
      });
    } else if (Platform.OS === 'android') {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: fileUri,
        flags: 1,
        type: mimeType,
      });
    }
  } catch (error) {
    console.error('Error opening file with external app:', error);
    throw error;
  }
};
