import { AuthGuard } from '@/components/auth-guard';
import { NavBar } from '@/components/nav-bar';
import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDispatchClient, useNotifications } from 'dispatch-lib';
import * as Network from 'expo-network';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type NotificationType = 'assignment' | 'update' | 'alert' | 'info';

interface SwipeableNotificationProps {
  item: any;
  type: NotificationType;
  colors: any;
  getNotificationIcon: (type: NotificationType) => any;
  getNotificationColor: (type: NotificationType) => string;
  formatTimestamp: (timestamp: string) => string;
  onDelete: (id: string) => void;
  onPress: () => void;
  onLongPress: () => void;
  isSelected: boolean;
  selectionMode: boolean;
}

function SwipeableNotification({
  item,
  type,
  colors,
  getNotificationIcon,
  getNotificationColor,
  formatTimestamp,
  onDelete,
  onPress,
  onLongPress,
  isSelected,
  selectionMode,
}: SwipeableNotificationProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);
  const swipeThreshold = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Respond to horizontal swipes (left or right)
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        // Prevent the TouchableOpacity from being triggered
      },
      onPanResponderMove: (_, gestureState) => {
        // Allow swiping left (negative) and right (positive) but limit right to 0
        const newValue = Math.min(gestureState.dx, 0);
        translateX.setValue(Math.max(newValue, swipeThreshold));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < swipeThreshold / 2 && gestureState.dx < 0) {
          // If swiped left past halfway, snap to delete position
          Animated.spring(translateX, {
            toValue: swipeThreshold,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
            mass: 0.8,
          }).start();
        } else {
          // Otherwise, snap back to original position (includes right swipes)
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
            mass: 0.8,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    onDelete(item.id);
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Delete Button Background */}
      <View style={styles.deleteBackground}>
        <View style={styles.deleteButtonContent}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Card */}
      <Animated.View
        style={[
          styles.notificationCardWrapper,
          { transform: [{ translateX }] },
        ]}
      >
        <View {...panResponder.panHandlers} style={{ flex: 1 }}>
          <TouchableOpacity
            style={[
              styles.notificationCard,
              {
                backgroundColor: isPressed ? colors.background : colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
                borderWidth: isSelected ? 2 : 1,
                borderRadius: 12,
              },
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            activeOpacity={1}
          >
          <View style={styles.notificationIconContainer}>
            {selectionMode && (
              <View style={[styles.checkbox, { borderColor: colors.border }]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </View>
            )}
            <View
              style={[
                styles.notificationIconCircle,
                { backgroundColor: `${getNotificationColor(type)}20` },
              ]}
            >
              <Ionicons
                name={getNotificationIcon(type)}
                size={24}
                color={getNotificationColor(type)}
              />
            </View>
          </View>
          
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                {item.title || 'Notification'}
              </Text>
              {!item.is_read && (
                <View style={[styles.readDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
            
            <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
              {item.body}
            </Text>
            
            <View style={styles.notificationFooter}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                {formatTimestamp(item.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

function NotificationsContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useOfficerAuth();
  const insets = useSafeAreaInsets();
  const { notifications: allNotifications, loading, error, deleteNotification } = useNotifications();
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [tappedNotifications, setTappedNotifications] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resolvedInfo, setResolvedInfo] = useState<{ visible: boolean; reportId?: string; resolvedAt?: string }>({ visible: false });
  const [notAssignedInfo, setNotAssignedInfo] = useState<{ visible: boolean; reportId?: string }>({ visible: false });
  const [netError, setNetError] = useState<string | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Network-aware loading guard: if stuck loading, show friendly message
  useEffect(() => {
    let mounted = true;
    async function checkNet() {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!mounted) return;
        if (!state.isInternetReachable) {
          setNetError('Unable to load. Please check your internet and try again later');
        } else {
          setNetError(null);
        }
      } catch {
        // ignore
      }
    }
    if (loading && !error) {
      checkNet();
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = setTimeout(() => {
        setNetError('Unable to load. Please check your internet and try again later');
      }, 12000);
    } else {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      // clear net error when not loading and no explicit hook error
      if (!loading && !error) setNetError(null);
    }
    return () => {
      mounted = false;
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [loading, error]);

  // handleRetry declared after handleRefresh to avoid temporal dead zone
  const readNotificationsLoaded = useRef(false);
  const tappedNotificationsLoaded = useRef(false);

  // Load tapped notifications from AsyncStorage (for blue dot display)
  useEffect(() => {
    async function loadTappedNotifications() {
      try {
        const stored = await AsyncStorage.getItem('tappedNotifications');
        const parsed = stored ? JSON.parse(stored) : [];
        setTappedNotifications(new Set(parsed));
      } catch (error) {
        console.error('Error loading tapped notifications:', error);
      } finally {
        tappedNotificationsLoaded.current = true;
      }
    }
    loadTappedNotifications();
  }, []);

  // Reload tapped notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      async function reloadTappedNotifications() {
        try {
          const stored = await AsyncStorage.getItem('tappedNotifications');
          const parsed = stored ? JSON.parse(stored) : [];
          setTappedNotifications(new Set(parsed));
        } catch (error) {
          console.error('Error reloading tapped notifications:', error);
        }
      }
      reloadTappedNotifications();
    }, [])
  );

  // Save tapped notifications to AsyncStorage whenever it changes
  useEffect(() => {
    if (!tappedNotificationsLoaded.current) {
      return;
    }
    AsyncStorage.setItem('tappedNotifications', JSON.stringify(Array.from(tappedNotifications))).catch(error => {
      console.error('Error saving tapped notifications:', error);
    });
  }, [tappedNotifications]);

  // Load read notifications from AsyncStorage
  useEffect(() => {
    async function loadReadNotifications() {
      try {
        const stored = await AsyncStorage.getItem('readNotifications');
        const parsed = stored ? JSON.parse(stored) : [];
        setReadNotifications(new Set(parsed));
      } catch (error) {
        console.error('Error loading read notifications:', error);
      } finally {
        readNotificationsLoaded.current = true;
      }
    }
    loadReadNotifications();
  }, []);

  // Reload read notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      async function reloadReadNotifications() {
        try {
          const stored = await AsyncStorage.getItem('readNotifications');
          const parsed = stored ? JSON.parse(stored) : [];
          setReadNotifications(new Set(parsed));
        } catch (error) {
          console.error('Error reloading read notifications:', error);
        }
      }
      reloadReadNotifications();
    }, [])
  );

  // Save read notifications to AsyncStorage whenever it changes
  useEffect(() => {
    if (!readNotificationsLoaded.current) {
      return;
    }
    AsyncStorage.setItem('readNotifications', JSON.stringify(Array.from(readNotifications))).catch(error => {
      console.error('Error saving read notifications:', error);
    });
  }, [readNotifications]);

  // Filter notifications for the current user
  const notifications = useMemo(() => {
    if (!user?.id) return [];
    return allNotifications
      .filter(notification => notification.user_id === user.id)
      .map(n => ({
        ...n,
        // Use tappedNotifications to show/hide blue dot
        is_read: tappedNotifications.has(n.id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allNotifications, user?.id, tappedNotifications]);

  // Helper function to format timestamp
  const formatTimestamp = (created_at: string) => {
    const date = new Date(created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Determine notification type from title/body
  const getNotificationType = (title: string | null, body: string): NotificationType => {
    const text = `${title || ''} ${body}`.toLowerCase();
    if (text.includes('assign')) return 'assignment';
    if (text.includes('update')) return 'update';
    if (text.includes('alert') || text.includes('urgent')) return 'alert';
    return 'info';
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'assignment':
        return 'document-text';
      case 'update':
        return 'refresh';
      case 'alert':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'assignment':
        return colors.primary;
      case 'update':
        return colors.info;
      case 'alert':
        return colors.warning;
      case 'info':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const handleDeleteNotification = useCallback(async (id: string) => {
    await deleteNotification(id);
  }, [deleteNotification]);

  const handleNotificationPress = useCallback(async (item: typeof notifications[0]) => {
		if (selectionMode) {
			// Toggle selection
			setSelectedIds(prev => {
				const newSet = new Set(prev);
				if (newSet.has(item.id)) {
					newSet.delete(item.id);
				} else {
					newSet.add(item.id);
				}
				return newSet;
			});
		} else {
			// Mark as tapped (remove blue dot) when tapping notification
			if (!item.is_read) {
				setTappedNotifications(prev => {
					const newSet = new Set(prev);
					newSet.add(item.id);
					return newSet;
				});
				
				// Save immediately to AsyncStorage
				try {
					const stored = await AsyncStorage.getItem('tappedNotifications');
					const currentSet = stored ? new Set(JSON.parse(stored)) : new Set();
					currentSet.add(item.id);
					await AsyncStorage.setItem('tappedNotifications', JSON.stringify(Array.from(currentSet)));
				} catch (error) {
					console.error('Error saving tapped notification:', error);
				}
			}
			
      // Navigate to report unless it's already resolved or assigned to another officer
			const reportIdMatch = item.body.match(/#(\d+)/) || item.title?.match(/#(\d+)/);
			if (reportIdMatch) {
        const reportId = reportIdMatch[1];
        try {
          const client = getDispatchClient();
          const { data, error } = await client.supabaseClient
            .from('reports')
            .select('id, status, resolved_at')
            .eq('id', Number(reportId))
            .single();

          if (!error && data && data.status === 'resolved') {
            setResolvedInfo({ visible: true, reportId, resolvedAt: data.resolved_at });
            return;
          }

          // Check current officer assignment: if this report is not assigned to me, show notice
          if (user?.id) {
            const { data: officerRow, error: officerErr } = await client.supabaseClient
              .from('officers')
              .select('assigned_report_id')
              .eq('id', user.id)
              .single();
            if (!officerErr) {
              const assignedId = (officerRow as any)?.assigned_report_id ?? null;
              if (Number(reportId) !== Number(assignedId)) {
                setNotAssignedInfo({ visible: true, reportId });
                return;
              }
            }
          }
        } catch (e) {
          console.error('Error checking report status:', e);
        }
        router.push(`/report/${reportId}` as any);
			}
		}
  }, [router, selectionMode]);  const handleLongPress = useCallback((item: typeof notifications[0]) => {
    setSelectedNotification(item);
    setShowOptionsModal(true);
  }, []);

  const handleMarkAsRead = useCallback(() => {
    if (selectedNotification) {
      setReadNotifications(prev => {
        const newSet = new Set(prev);
        if (newSet.has(selectedNotification.id)) {
          newSet.delete(selectedNotification.id);
        } else {
          newSet.add(selectedNotification.id);
        }
        return newSet;
      });
    }
    setShowOptionsModal(false);
    setSelectedNotification(null);
  }, [selectedNotification]);

  const handleDeleteSingle = useCallback(async () => {
    if (selectedNotification) {
      await deleteNotification(selectedNotification.id);
      setShowOptionsModal(false);
      setSelectedNotification(null);
    }
  }, [selectedNotification, deleteNotification]);

  const handleDeleteSelected = useCallback(async () => {
    for (const id of selectedIds) {
      await deleteNotification(id);
    }
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds, deleteNotification]);

  const handleSelectAll = useCallback(() => {
    // If all are selected, unselect all. Otherwise, select all.
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(notifications.map(n => n.id));
      setSelectedIds(allIds);
    }
  }, [notifications, selectedIds.size]);

  const handleCancelSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reload tapped notifications from AsyncStorage
      const stored = await AsyncStorage.getItem('tappedNotifications');
      if (stored) {
        setTappedNotifications(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleRetry = useCallback(async () => {
    setNetError(null);
    try {
      const state = await Network.getNetworkStateAsync();
      if (!state.isInternetReachable) {
        setNetError('Unable to load. Please check your internet and try again later');
      } else {
        await handleRefresh();
      }
    } catch {
      setNetError('Unable to load. Please check your internet and try again later');
    }
  }, [handleRefresh]);

  const renderNotification = ({ item }: { item: typeof notifications[0] }) => {
    const type = getNotificationType(item.title, item.body);
    
    return (
      <SwipeableNotification
        item={item}
        type={type}
        colors={colors}
        getNotificationIcon={getNotificationIcon}
        getNotificationColor={getNotificationColor}
        formatTimestamp={formatTimestamp}
        onDelete={handleDeleteNotification}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleLongPress(item)}
        isSelected={selectedIds.has(item.id)}
        selectionMode={selectionMode}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Navigation Bar */}
      <NavBar
        title="Notifications"
        leftIcon={selectionMode ? "close" : "arrow-back"}
        onLeftPress={selectionMode ? handleCancelSelection : () => router.back()}
        showLeftIcon={true}
        showRightIcon={!selectionMode}
        rightIcon={!selectionMode ? "options-outline" : undefined}
        onRightPress={!selectionMode ? () => setSelectionMode(true) : undefined}
      />

      {/* Notifications List */}
      {netError ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Unable to Load</Text>
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 8 }]}>{netError}</Text>
          <TouchableOpacity
            style={{ marginTop: 16, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={handleRetry}
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading notifications...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Failed to load notifications
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {error.message}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContent}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={64} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No notifications yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  You'll see important updates here
                </Text>
              </View>
            }
          />

          {/* Selection Mode Action Bar */}
          {selectionMode && (
            <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
              <Text style={[styles.actionBarText, { color: colors.text }]}>
                {selectedIds.size} selected
              </Text>
              <View style={styles.actionBarButtons}>
                <TouchableOpacity
                  style={[styles.actionBarButton, { backgroundColor: colors.primary }]}
                  onPress={handleSelectAll}
                >
                  <Ionicons name={selectedIds.size === notifications.length ? "close-circle" : "checkmark-circle"} size={20} color="#fff" />
                  <Text style={styles.actionBarButtonText}>{selectedIds.size === notifications.length ? "Unselect All" : "Select All"}</Text>
                </TouchableOpacity>
                {selectedIds.size > 0 && (
                  <TouchableOpacity
                    style={[styles.actionBarButton, { backgroundColor: colors.error }]}
                    onPress={handleDeleteSelected}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.actionBarButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </>
      )}

      {/* Long Press Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Notification Options
            </Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleDeleteSingle}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
              <Text style={[styles.modalOptionText, { color: colors.error }]}>
                Remove
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Not Assigned Info Modal */}
      <Modal
        visible={notAssignedInfo.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotAssignedInfo({ visible: false })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotAssignedInfo({ visible: false })}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Report Not Assigned</Text>
            <Text style={[styles.modalOptionText, { color: colors.textSecondary, textAlign: 'center', marginBottom: 12 }]}>
              {notAssignedInfo.reportId
                ? `Report #${notAssignedInfo.reportId} might be assigned to another officer.`
                : 'This report might be assigned to another officer.'}
            </Text>
            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
              onPress={() => setNotAssignedInfo({ visible: false })}
            >
              <Text style={[styles.modalCancelText, { color: colors.text }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Resolved Report Info Modal */}
      <Modal
        visible={resolvedInfo.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setResolvedInfo({ visible: false })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setResolvedInfo({ visible: false })}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="checkmark-done-outline" size={48} color={colors.success} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Report Resolved</Text>
            <Text style={[styles.modalOptionText, { color: colors.textSecondary, textAlign: 'center', marginBottom: 12 }]}>
              {resolvedInfo.reportId ? `Report #${resolvedInfo.reportId} is already resolved.` : 'This report is already resolved.'}
            </Text>
            {resolvedInfo.resolvedAt && (
              <Text style={[styles.modalOptionText, { color: colors.textSecondary, textAlign: 'center', marginBottom: 12 }]}>
                Resolved on {new Date(resolvedInfo.resolvedAt).toLocaleDateString()} at {new Date(resolvedInfo.resolvedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
              onPress={() => setResolvedInfo({ visible: false })}
            >
              <Text style={[styles.modalCancelText, { color: colors.text }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

export default function Notifications() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  swipeContainer: {
    marginBottom: 12,
    position: 'relative',
    borderRadius: 12,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 1,
    bottom: 1,
    left: '50%',
    backgroundColor: '#DC2626',
    borderRadius: 11,
  },
  deleteButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  notificationCardWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIconContainer: {
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  readDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionBarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionBarButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionBarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalCancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
