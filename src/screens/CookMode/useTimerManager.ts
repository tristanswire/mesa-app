import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserPreferences } from '../../data/preferences';

export type TimerStatus = 'idle' | 'running' | 'completed';

export type TimerState = {
  id: string;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  startedAt: number | null;
  notificationId: string | null;
};

const TICK_INTERVAL_MS = 1000;

export function useTimerManager() {
  const [timers, setTimers] = useState<Record<string, TimerState>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundEnabledRef = useRef<boolean>(true);
  const timersRef = useRef<Record<string, TimerState>>({});
  const player = useAudioPlayer(require('../../../assets/sounds/timer-complete.wav'));

  // Keep ref synced — cancelTimer needs the latest timers map without recreating callback
  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  // Load preferences + configure audio session on mount.
  // useAudioPlayer manages the player lifecycle automatically — no manual unload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prefs = await getUserPreferences();
        if (!cancelled) soundEnabledRef.current = prefs.timerSoundEnabled;
      } catch (e) {
        console.error('[timer] failed to load preferences:', e);
      }

      try {
        // Plays through iOS silent mode — kitchen timers must be audible
        // even if the phone is muted.
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: false,
          interruptionMode: 'duckOthers',
        });
      } catch (e) {
        console.error('[timer] failed to configure audio mode:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const triggerCompletion = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (soundEnabledRef.current) {
      try {
        // expo-audio handles session activation internally
        player.seekTo(0);
        player.play();
      } catch (e) {
        console.error('[timer] sound playback failed:', e);
      }
    }
  }, [player]);

  // 1Hz tick — derive remaining from startedAt to self-correct any skipped ticks
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        let changed = false;
        const justCompleted: TimerState[] = [];

        for (const id of Object.keys(next)) {
          const t = next[id];
          if (t.status !== 'running' || t.startedAt === null) continue;

          const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
          const remaining = Math.max(0, t.durationSeconds - elapsed);

          if (remaining !== t.remainingSeconds) {
            next[id] = { ...t, remainingSeconds: remaining };
            changed = true;
          }

          if (remaining === 0) {
            next[id] = { ...next[id], status: 'completed', remainingSeconds: 0 };
            changed = true;

            // If completion was discovered >2s late, the app was likely backgrounded —
            // the iOS local notification already alerted the user. Skip in-app
            // side effects to avoid double alert + audio session weirdness on resume.
            const lateBySec = (Date.now() - t.startedAt) / 1000 - t.durationSeconds;
            if (lateBySec < 2) {
              justCompleted.push(next[id]);
            } else {
              console.log(
                `[timer] discovered late completion (${lateBySec.toFixed(1)}s late) — skipping in-app alert`,
              );
            }
          }
        }

        if (justCompleted.length > 0) {
          // Run side effects outside setState
          queueMicrotask(() => {
            for (const _t of justCompleted) {
              triggerCompletion();
            }
          });
        }

        return changed ? next : prev;
      });
    }, TICK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [triggerCompletion]);

  const startTimer = useCallback(
    async (id: string, label: string, durationSeconds: number) => {
      // Lazy permission request on first timer start
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }

      let notificationId: string | null = null;
      try {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Timer done',
            body: label,
            sound: soundEnabledRef.current ? 'timer-complete.wav' : undefined,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: durationSeconds,
          },
        });
      } catch (e) {
        console.error('[timer] failed to schedule notification:', e);
      }

      setTimers((prev) => ({
        ...prev,
        [id]: {
          id,
          label,
          durationSeconds,
          remainingSeconds: durationSeconds,
          status: 'running',
          startedAt: Date.now(),
          notificationId,
        },
      }));
    },
    [],
  );

  const cancelTimer = useCallback(async (id: string) => {
    const timer = timersRef.current[id];
    if (timer?.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
      } catch (e) {
        console.error('[timer] failed to cancel notification:', e);
      }
    }
    setTimers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const dismissCompletedTimer = useCallback((id: string) => {
    setTimers((prev) => {
      if (prev[id]?.status !== 'completed') return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return { timers, startTimer, cancelTimer, dismissCompletedTimer };
}
