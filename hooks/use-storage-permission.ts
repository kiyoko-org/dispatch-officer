import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform } from 'react-native';

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
 * Downloads a file from a signed URL and stores it in the phone's Downloads folder
 * @param signedUrl - The signed URL to download from
 * @param filename - The filename to save as
 * @returns true if successful, false otherwise
 */
export const downloadFile = async (signedUrl: string, filename: string): Promise<boolean> => {
  try {
    let downloadDir: string;

    if (Platform.OS === 'android') {
      downloadDir = 'file:///sdcard/Download/';
    } else if (Platform.OS === 'ios') {
      // iOS Documents folder (visible in Files app)
      downloadDir = `${FileSystem.documentDirectory}Downloads/`;
    } else {
      downloadDir = `${FileSystem.documentDirectory}Downloads/`;
    }
    
    const dirInfo = await FileSystem.getInfoAsync(downloadDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
    }

    const filePath = `${downloadDir}${filename}`;

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
    Alert.alert('Success', `File downloaded: ${filename}`);
    return true;
  } catch (error) {
    console.error('Download error:', error);
    Alert.alert('Download Failed', 'Could not download the file. Please try again.');
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
