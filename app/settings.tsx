import { NavBar } from '@/components/nav-bar';
import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { themeMode, activeTheme, setThemeMode, isAmoledMode, setIsAmoledMode, colors } = useTheme();
  const { signOut } = useOfficerAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  async function confirmLogout() {
    setShowLogoutModal(false);
    await signOut();
    router.replace('/login');
  }

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={() => setShowLogoutModal(true)}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="log-out-outline" size={48} color="#DC2626" />
            </View>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to logout?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

// Removed PushDebug (token/testing) controls per request

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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
    borderWidth: 0,
  },
  logoutButtonText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
