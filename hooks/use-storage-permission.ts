import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

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

export const downloadFile = async (signedUrl: string, filename: string): Promise<boolean> => {
  try {
    let downloadDir: string;

    if (Platform.OS === 'android') {
      downloadDir = 'file:///sdcard/Download/';
    } else if (Platform.OS === 'ios') {
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

    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync(
          'android.intent.action.VIEW',
          {
            data: result.uri,
            flags: 1,
          }
        );
      } catch (error) {
        console.error('Error opening file:', error);
        Alert.alert('File Downloaded', `File saved to Downloads folder`);
      }
    } else {
      Alert.alert('File Downloaded', `File saved successfully`);
    }

    return true;
  } catch (error) {
    console.error('Download error:', error);
    Alert.alert('Download Failed', 'Could not download the file. Please try again.');
    return false;
  }
};
