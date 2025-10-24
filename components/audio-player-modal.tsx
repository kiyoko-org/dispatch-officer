import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AudioPlayerModalProps {
  visible: boolean;
  uri: string;
  filename: string;
  onClose: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
  colors: any;
  backdropColor?: string;
}

export function AudioPlayerModal({
  visible,
  uri,
  filename,
  onClose,
  onDownload,
  isDownloading = false,
  colors,
  backdropColor,
}: AudioPlayerModalProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio and load sound
  useEffect(() => {
    if (!visible) return;

    const initializeAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false }
        );

        soundRef.current = sound;

        // Get duration
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          setDuration(status.durationMillis);
        }

        // Set up playback status update
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setIsPlaying(status.isPlaying);

            // Stop when finished
            if (status.didJustFinish && !status.isLooping) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        });
      } catch (err) {
        console.error('Error initializing audio:', err);
        setError('Failed to load audio');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [visible, uri]);

  const handlePlayPause = async () => {
    try {
      if (!soundRef.current) return;

      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (err) {
      console.error('Play/Pause error:', err);
      setError('Failed to control playback');
    }
  };

  const handleStop = async () => {
    try {
      if (!soundRef.current) return;
      await soundRef.current.stopAsync();
      setPosition(0);
      setIsPlaying(false);
    } catch (err) {
      console.error('Stop error:', err);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = async (event: any) => {
    if (!soundRef.current || duration === 0) return;

    try {
      const { locationX } = event.nativeEvent;
      
      // Get width from the target
      const width = (event.target as any)?.offsetWidth || 0;
      if (width === 0) return;
      
      const percentage = Math.max(0, Math.min(1, locationX / width));
      const newPosition = percentage * duration;
      
      await soundRef.current.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (err) {
      console.error('Seek error:', err);
    }
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: backdropColor || 'rgba(0, 0, 0, 0.5)' }]}>
        <View
          style={[
            styles.playerContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[styles.filename, { color: colors.text }]}
              numberOfLines={1}
            >
              {filename}
            </Text>
            <View style={styles.headerButtons}>
              {onDownload && (
                <TouchableOpacity
                  onPress={onDownload}
                  disabled={isDownloading}
                  style={[styles.headerButton, { opacity: isDownloading ? 0.5 : 1 }]}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <TouchableOpacity
              onPress={handleSeek}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${progressPercentage}%`,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
            <View style={styles.timeContainer}>
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {formatTime(position)}
              </Text>
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {formatTime(duration)}
              </Text>
            </View>
          </View>

          {/* Controls */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#EF4444"
              />
              <Text style={[styles.errorText, { color: '#EF4444' }]}>
                {error}
              </Text>
            </View>
          ) : (
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={handleStop}
                disabled={isLoading}
                style={[styles.button, { opacity: isLoading ? 0.5 : 1 }]}
              >
                <Ionicons
                  name="stop"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePlayPause}
                disabled={isLoading}
                style={[styles.button, { opacity: isLoading ? 0.5 : 1 }]}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                  />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={28}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  playerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 320,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    justifyContent: 'space-between',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  filename: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  progressSection: {
    marginBottom: 12,
    gap: 6,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
