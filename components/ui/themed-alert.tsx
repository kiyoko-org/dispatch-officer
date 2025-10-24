import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ThemedAlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface ThemedAlertOptions {
  title: string;
  message?: string;
  confirmText?: string;
  onConfirm?: () => void;
  variant?: ThemedAlertVariant;
}

type HostState = { visible: boolean; options: ThemedAlertOptions | null };

let setHostStateRef: ((updater: (s: HostState) => HostState) => void) | null = null;

export function ThemedAlertHost() {
  const { colors, activeTheme } = useTheme();
  const [state, setState] = useState<HostState>({ visible: false, options: null });

  useEffect(() => {
    setHostStateRef = (updater) => setState((s) => updater(s));
    return () => {
      setHostStateRef = null;
    };
  }, []);

  const opts = state.options;
  const variant: ThemedAlertVariant = opts?.variant || 'info';

  const iconName =
    variant === 'success' ? 'checkmark-circle' :
    variant === 'warning' ? 'warning' :
    variant === 'error' ? 'alert-circle' : 'information-circle';

  const iconColor =
    variant === 'success' ? colors.success :
    variant === 'warning' ? colors.warning :
    variant === 'error' ? colors.error : colors.info;

  const backdropColor = activeTheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)';

  const onClose = () => {
    const cb = opts?.onConfirm;
    setState({ visible: false, options: null });
    if (cb) setTimeout(cb, 0);
  };

  return (
    <Modal visible={state.visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: backdropColor }]}>
        <SafeAreaView style={{ width: '100%' }} edges={['top', 'bottom']}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.headerRow}>
              <Ionicons name={iconName} size={24} color={iconColor} />
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {opts?.title}
              </Text>
            </View>
            {!!opts?.message && (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {opts.message}
              </Text>
            )}
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={styles.buttonText}>{opts?.confirmText || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export function showThemedAlert(options: ThemedAlertOptions) {
  if (setHostStateRef) {
    setHostStateRef(() => ({ visible: true, options }));
  } else {
    // Fallback: if host not mounted, no-op or console log
    console.warn('ThemedAlertHost is not mounted. Alert not shown:', options?.title);
  }
}

export function dismissThemedAlert() {
  if (setHostStateRef) {
    setHostStateRef(() => ({ visible: false, options: null }));
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
