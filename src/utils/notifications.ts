import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

let permissionRequested = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted' && !permissionRequested) {
      permissionRequested = true;
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reviews', {
        name: 'Vocabulary reviews',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200],
      });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Schedule a single reminder for the next time cards become due.
 * We cancel previous reminders first so there's always at most one pending.
 */
export async function scheduleReviewReminder(nextDueAt: number, dueCount: number): Promise<void> {
  const ok = await ensureNotificationPermission();
  if (!ok) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  // If something is already due, remind in ~1 hour so we don't nag instantly.
  const fireAt = Math.max(nextDueAt, now + 60 * 60 * 1000);
  const seconds = Math.max(60, Math.round((fireAt - now) / 1000));

  const body =
    dueCount > 0
      ? `You have ${dueCount} word${dueCount === 1 ? '' : 's'} ready to review.`
      : 'Time to review your saved words and keep your streak alive.';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Passage · Review time',
      body,
      data: { type: 'review' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

export async function cancelReviewReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
