import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

/**
 * Downloads an audio file from a signed URL to app cache and returns the local URI
 * @param signedUrl - The signed URL to download from
 * @param filename - The filename to save as
 * @returns The local file URI if successful, null otherwise
 */
export const downloadAudioToCache = async (signedUrl: string, filename: string): Promise<string | null> => {
  try {
    const cacheDir = `${FileSystem.cacheDirectory}audio/`;
    
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    const filePath = `${cacheDir}${filename}`;

    // Check if file already exists in cache
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      console.log('Audio file already cached:', filePath);
      return filePath;
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

    console.log('Audio file downloaded to cache:', result.uri);
    return result.uri;
  } catch (error) {
    console.error('Error downloading audio to cache:', error);
    Alert.alert('Error', 'Could not download audio file.');
    return null;
  }
};

/**
 * Clears all cached audio files
 */
export const clearAudioCache = async (): Promise<boolean> => {
  try {
    const cacheDir = `${FileSystem.cacheDirectory}audio/`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(cacheDir);
      console.log('Audio cache cleared');
      return true;
    }
    return true;
  } catch (error) {
    console.error('Error clearing audio cache:', error);
    return false;
  }
};
