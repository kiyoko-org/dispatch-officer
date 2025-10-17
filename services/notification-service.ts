import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static notificationListener: Notifications.Subscription | null = null;
  private static responseListener: Notifications.Subscription | null = null;
  private static devicePushToken: string | null = null; // FCM on Android
  private static lastError: string | null = null;

  /**
   * Request notification permissions (no push token needed for local notifications)
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      this.lastError = null;
      // Check if running on physical device (required for push notifications)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get notification permissions!');
        return null;
      }

      // Retrieve device push token (FCM on Android)
      if (Platform.OS === 'android') {
        // Some devices need a short delay/retry for FCM token generation
        const maxAttempts = 4;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const devToken = await Notifications.getDevicePushTokenAsync();
            this.devicePushToken = (devToken as any)?.data || (devToken as any)?.token || null;
            if (this.devicePushToken) {
              console.log('[Notifications] FCM device token:', this.devicePushToken);
              return this.devicePushToken;
            }
          } catch (err: any) {
            this.lastError = err?.message || String(err);
            console.warn(`Unable to get FCM device token (attempt ${attempt}/${maxAttempts}).`, err);
          }
          // Wait a bit before retrying
          await new Promise((res) => setTimeout(res, 800));
        }
      }

      console.log('Notification permissions granted (no device token)');
      return null;
    } catch (error) {
      this.lastError = (error as any)?.message || String(error);
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Schedule a local notification for a new assigned report
   */
  static async scheduleNewReportNotification(reportData: {
    id: number;
    title?: string;
    description?: string;
    location?: string;
  }): Promise<string | null> {
    try {
      // Ensure we have permission at the moment of scheduling
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== 'granted') {
          console.warn('Notification permission not granted; skipping schedule.');
          return null;
        }
      }

      // Ensure Android channel exists
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      const title = reportData.title || `New Report Assigned (#${reportData.id})`;
      const body = reportData.description || reportData.location || 'Tap to view details';
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 ' + title,
          body,
          data: { 
            reportId: reportData.id,
            type: 'new_assignment',
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          // @ts-expect-error channelId is Android-only and supported at runtime
          channelId: 'default',
        },
        trigger: null, // Show immediately
      });

      console.log('Scheduled new report notification with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Set up notification listeners
   */
  static setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listen for user tapping on notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });
  }

  /**
   * Remove notification listeners
   */
  static removeNotificationListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  static async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Returns the cached device push token (FCM on Android) if available
   */
  static getDevicePushToken(): string | null {
    return this.devicePushToken;
  }

  /**
   * Returns the last error encountered during registration/token retrieval
   */
  static getLastError(): string | null {
    return this.lastError;
  }
}
