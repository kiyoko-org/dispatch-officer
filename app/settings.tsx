import { NavBar } from '@/components/nav-bar';
import { useTheme } from '@/contexts/theme-context';
import { NotificationService } from '@/services/notification-service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { themeMode, activeTheme, setThemeMode, isAmoledMode, setIsAmoledMode, colors } = useTheme();

  const ThemeOption = ({ 
    label, 
    value, 
    icon 
  }: { 
    label: string; 
    value: 'light' | 'dark' | 'system'; 
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    const isSelected = themeMode === value;
    
    return (
      <TouchableOpacity
        style={[
          styles.themeOption,
          { 
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => setThemeMode(value)}
      >
        <View style={styles.themeOptionContent}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={isSelected ? colors.primary : colors.textSecondary} 
          />
          <Text style={[
            styles.themeOptionText,
            { color: isSelected ? colors.text : colors.textSecondary }
          ]}>
            {label}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <NavBar
        title="Settings"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
      />
      
      <ScrollView style={styles.content}>
        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.settingHeader}>
              <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
              <Text style={[styles.settingTitle, { color: colors.text }]}>Theme</Text>
            </View>
            
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Choose your preferred theme or use system settings
            </Text>

            <View style={styles.themeOptions}>
              <ThemeOption label="Light" value="light" icon="sunny-outline" />
              <ThemeOption label="Dark" value="dark" icon="moon-outline" />
              <ThemeOption label="System" value="system" icon="phone-portrait-outline" />
              
              {/* AMOLED Option - Only visible when dark theme is active */}
              {activeTheme === 'dark' && (
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { 
                      backgroundColor: colors.card,
                      borderColor: isAmoledMode ? colors.primary : colors.border,
                      borderWidth: isAmoledMode ? 2 : 1,
                    }
                  ]}
                  onPress={() => setIsAmoledMode(!isAmoledMode)}
                >
                  <View style={styles.themeOptionContent}>
                    <Ionicons 
                      name="contrast-outline" 
                      size={24} 
                      color={isAmoledMode ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.themeOptionText,
                      { color: isAmoledMode ? colors.text : colors.textSecondary }
                    ]}>
                      AMOLED
                    </Text>
                  </View>
                  {isAmoledMode && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.activeThemeIndicator, { backgroundColor: colors.background }]}>
              <Ionicons 
                name={activeTheme === 'dark' ? 'moon' : 'sunny'} 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.activeThemeText, { color: colors.textSecondary }]}>
                Current: {activeTheme === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow
              icon="notifications-outline"
              title="Push Notifications"
              description="Receive alerts for new incidents"
              colors={colors}
              rightComponent={<Switch value={true} onValueChange={() => {}} />}
            />
            {/* Push Debug Tools */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <PushDebug colors={colors} />
          </View>
        </View>

        

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ 
  icon, 
  title, 
  description, 
  colors, 
  rightComponent, 
  onPress 
}: { 
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  colors: any;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingRowTitle, { color: colors.text }]}>{title}</Text>
          {description && (
            <Text style={[styles.settingRowDescription, { color: colors.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      ))}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function PushDebug({ colors }: { colors: any }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureToken() {
    setLoading(true);
    try {
      let t = NotificationService.getDevicePushToken();
      if (!t) {
        t = await NotificationService.registerForPushNotifications();
      }
      setToken(t || null);
      const lastErr = NotificationService.getLastError();
      setError(lastErr);
      if (!t) {
        const msg = lastErr || 'Make sure google-services.json is added and the app was rebuilt.';
        Alert.alert('No device token yet', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function shareToken() {
    const t = token || NotificationService.getDevicePushToken();
    if (!t) {
      Alert.alert('No token', 'Tap "Get device token" first.');
      return;
    }
    await Share.share({ message: t });
  }

  return (
    <View>
      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
        Push Debug: get your device token to test FCM from Firebase Console.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={ensureToken}
          style={{ backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 }}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>{loading ? 'Loading…' : 'Get device token'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={shareToken}
          style={{ backgroundColor: colors.card, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.text }}>Share token</Text>
        </TouchableOpacity>
      </View>
      {token ? (
        <Text style={{ color: colors.textSecondary, marginTop: 8 }} numberOfLines={3}>
          Token: {token}
        </Text>
      ) : null}
      {error ? (
        <Text style={{ color: '#DC2626', marginTop: 6 }} numberOfLines={3}>
          Last error: {error}
        </Text>
      ) : null}
      <View style={{ height: 8 }} />
      <TouchableOpacity
        onPress={() => NotificationService.scheduleNewReportNotification({ id: 0, title: 'Local test', description: 'If you see this while app is open, local works.' })}
        style={{ backgroundColor: colors.card, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
      >
        <Text style={{ color: colors.text }}>Send local test notification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  themeOptions: {
    gap: 12,
    marginBottom: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeThemeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  activeThemeText: {
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingRowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRowDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
