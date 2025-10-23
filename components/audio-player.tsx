import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AudioPlayerProps {
  uri: string;
  filename: string;
  colors: any;
}

export function AudioPlayer({ uri, filename, colors }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio and load sound
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setIsLoading(true);
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
      }
    };
  }, [uri]);

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

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
        <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Filename */}
      <Text style={[styles.filename, { color: colors.text }]} numberOfLines={1}>
        {filename}
      </Text>

      {/* Player Controls */}
      <View style={styles.controls}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <TouchableOpacity
              onPress={handleStop}
              disabled={isLoading}
              style={[styles.button, { opacity: isLoading ? 0.5 : 1 }]}
            >
              <Ionicons name="stop" size={18} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePlayPause}
              disabled={isLoading}
              style={[styles.button, { opacity: isLoading ? 0.5 : 1 }]}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Progress Bar and Time */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.border }
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progressPercentage}%` }
            ]}
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  filename: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  button: {
    padding: 8,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
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
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
