import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImagePreviewModalProps {
  visible: boolean;
  imageUri: string;
  filename: string;
  onClose: () => void;
  colors: any;
  onDownload?: () => void;
  isDownloading?: boolean;
}

export function ImagePreviewModal({
  visible,
  imageUri,
  filename,
  onClose,
  colors,
  onDownload,
  isDownloading = false,
}: ImagePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
        edges={['top', 'bottom']}
      >
        {/* Header Bar */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.filename, { color: colors.text }]} numberOfLines={1}>
            {filename}
          </Text>
          {onDownload && (
            <TouchableOpacity
              onPress={onDownload}
              disabled={isDownloading}
              style={[styles.headerButton, { opacity: isDownloading ? 0.5 : 1 }]}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="download-outline" size={24} color={colors.text} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Image Container */}
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: 'transparent' },
          ]}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, color: colors.textSecondary }}>
                Loading image…
              </Text>
            </View>
          )}

          <View style={styles.animatedImageWrapper}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              onLoad={() => setLoading(false)}
              resizeMode="contain"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 8,
  },
  filename: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginHorizontal: 12,
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  animatedImageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
