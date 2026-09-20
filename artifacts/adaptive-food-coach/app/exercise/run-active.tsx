import { Alert, AppState } from 'react-native';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

// Foreground timer



/** Step size used when the simulated time ticks forward. */
const TICK_MS = 1000;

const formatClock = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatPace = (secPerKm: number) => {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return `'--" /km`;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${String(s).padStart(2, '0')}\"/km`;
};

// Foreground GPS tracking pauses when the app leaves the foreground.
export default function RunActiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, actions } = useAppStore();

  const [elapsedSec, setElapsedSec] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [paused, setPausedState] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('Waiting for GPS');
  const lastPosition = useRef<Location.LocationObject | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());

  // Tick forward while running.
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      setElapsedSec((prev) => prev + 1);

    }, TICK_MS);
    // Add a subtle bell on each minute boundary.
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    let active = true; let subscription: Location.LocationSubscription | undefined;
    lastPosition.current = null;
    if (paused) return;
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw new Error('Location permission is needed to measure distance.');
        subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 }, position => {
          if (!active || (position.coords.accuracy ?? 100) > 30) return;
          setGpsStatus('GPS active · keep app open');
          const previous = lastPosition.current;
          if (previous) {
            const radians = (n: number) => n * Math.PI / 180;
            const a = previous.coords, b = position.coords;
            const deltaLat = radians(b.latitude - a.latitude), deltaLon = radians(b.longitude - a.longitude);
            const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(deltaLon / 2) ** 2;
            const meters = 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
            const seconds = (position.timestamp - previous.timestamp) / 1000;
            if (seconds > 0 && meters / seconds < 12 && meters > 2) setDistanceMeters(distance => distance + meters);
          }
          lastPosition.current = position;
        });
        if (!active) subscription.remove();
      } catch (error) { if (active) { setGpsStatus('GPS unavailable'); setPausedState(true); Alert.alert('Run tracking', error instanceof Error ? error.message : 'Location is unavailable.'); } }
    })();
    return () => { active = false; subscription?.remove(); };
  }, [paused]);
  useEffect(() => { const subscription = AppState.addEventListener('change', state => { if (state !== 'active') { setPausedState(true); lastPosition.current = null; } }); return () => subscription.remove(); }, []);

  const distanceKm = +(distanceMeters / 1000).toFixed(2);
  const paceSecPerKm =
    distanceKm >= 0.05 ? Math.round(elapsedSec / distanceKm) : 0;
  const paceLabel = formatPace(paceSecPerKm);

  // Calorie estimate — MET * kg * hours, calibrated to ~75kg athlete.
  const weightKg = state.profile?.currentWeightKg ?? 75;
  const caloriesBurned = Math.round(11.5 * (elapsedSec / 3600) * weightKg);

  const togglePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPausedState((p) => !p);
  }, []);

  const handleStop = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const durationMinutes = Math.max(1, Math.round(elapsedSec / 60));
    const distanceKmFinal = +distanceKm.toFixed(2);
    actions.logExercise({
      date: startedAtRef.current.slice(0, 10),
      type: 'running',
      durationMinutes,
      distanceKm: distanceKmFinal,
      pace: paceLabel,
      caloriesBurned,
    });
    router.back();
  }, [actions, caloriesBurned, distanceKm, elapsedSec, paceLabel, router]);

  const handleDiscard = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.back();
  }, [router]);

  const summary = useMemo(
    () => ({
      distanceKm,
      paceLabel,
      durationLabel: formatClock(elapsedSec),
      calories: caloriesBurned,
    }),
    [caloriesBurned, distanceKm, elapsedSec, paceLabel],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        transparent
        title="Active run"
        subtitle={paused ? 'Paused' : gpsStatus}
        rightIcon="x"
        onRightPress={handleDiscard}
      />

      <View style={styles.mapWrap} testID="run-active-map">
        <View style={styles.mapBg} />
        <View style={styles.mapBgAlt} />

        {/* Faux concentric ring + dot to suggest GPS fix. */}
        <View style={styles.mapGaugeOuter}>
          <View style={styles.mapGaugeMid}>
            <View style={styles.mapGaugeInner}>
              <Feather name="navigation" size={18} color="#0A0A0A" />
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.statsWrap, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.statsRow}>
          <StatTile
            label="Distance"
            value={`${summary.distanceKm.toFixed(2)}`}
            unit="km"
            accent="#FF6A1A"
            testID="run-stat-distance"
          />
          <StatTile
            label="Pace"
            value={summary.paceLabel}
            unit=""
            accent="#1570EF"
            tiny
            testID="run-stat-pace"
          />
        </View>
        <View style={styles.statsRow}>
          <StatTile
            label="Duration"
            value={summary.durationLabel}
            unit=""
            accent="#FFFFFF"
            big
            testID="run-stat-duration"
          />
        </View>
        <View style={styles.statsRow}>
          <StatTile
            label="Calories"
            value={`${summary.calories}`}
            unit="kcal"
            accent="#4ADE80"
            testID="run-stat-calories"
          />
          <StatTile
            label="Tracking"
            value={paused ? 'Paused' : 'GPS'}
            unit=""
            accent="#7C3AED"
            tiny
            testID="run-stat-effort"
          />
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={paused ? 'Resume run' : 'Pause run'}
            testID="run-toggle"
            onPress={togglePause}
            style={({ pressed }) => [styles.pauseBtn, pressed && styles.pressed]}
          >
            <Feather
              name={paused ? 'play' : 'pause'}
              size={22}
              color="#0A0A0A"
            />
            <Text style={styles.pauseLabel}>{paused ? 'Resume' : 'Pause'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop and save run"
            testID="run-stop"
            onPress={handleStop}
            style={({ pressed }) => [styles.stopBtn, pressed && styles.pressed]}
          >
            <View style={styles.stopIcon} />
            <Text style={styles.stopLabel}>Stop &amp; save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function StatTile({
  label,
  value,
  unit,
  accent,
  big,
  tiny,
  testID,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
  big?: boolean;
  tiny?: boolean;
  testID?: string;
}) {
  return (
    <View
      style={[
        styles.stat,
        big && styles.statBig,
      ]}
      testID={testID}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          tiny && styles.statValueTiny,
          big && styles.statValueBig,
          { color: accent },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  mapWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  mapBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#161618',
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  mapBgAlt: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  mapGaugeOuter: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 106, 26, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGaugeMid: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 106, 26, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGaugeInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6A1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  statsWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: '#0A0A0A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: '#1B1B1F',
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 88,
  },
  statBig: {
    flex: 1,
    paddingVertical: spacing.lg,
    minHeight: 120,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    marginTop: 4,
  },
  statValueBig: {
    fontSize: 56,
    letterSpacing: -1,
  },
  statValueTiny: {
    fontSize: 20,
  },
  statUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pauseLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#0A0A0A',
  },
  stopBtn: {
    flex: 2,
    backgroundColor: '#FF3B30',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  stopIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  stopLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  pressed: { opacity: 0.7 },
});
