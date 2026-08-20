import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import type { LiveTeamLocation } from '../types';
import type { TransportationMode } from '../types';
import { publishLiveTeamLocation } from './live-team-location-api';

export const LIVE_TEAM_LOCATION_TASK = 'vinago-live-team-location-v1';
const LAST_BACKGROUND_LOCATION_KEY = '@vinago/live-team/background-location';
const BACKGROUND_SESSION_KEY = '@vinago/live-team/background-session';

function serialize(location: Location.LocationObject): LiveTeamLocation {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    speed: location.coords.speed,
    heading: location.coords.heading,
    altitude: location.coords.altitude,
    timestamp: location.timestamp,
  };
}

if (!TaskManager.isTaskDefined(LIVE_TEAM_LOCATION_TASK)) {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LIVE_TEAM_LOCATION_TASK, async ({ data, error }) => {
    if (error || !data?.locations?.length) return;
    const latest = data.locations[data.locations.length - 1];
    const location = serialize(latest);
    await AsyncStorage.setItem(LAST_BACKGROUND_LOCATION_KEY, JSON.stringify(location));
    const rawSession = await AsyncStorage.getItem(BACKGROUND_SESSION_KEY);
    if (!rawSession) return;
    try {
      const session = JSON.parse(rawSession) as { roomCode: string; name: string; transportationMode: TransportationMode };
      await publishLiveTeamLocation(session.roomCode, session.name, session.transportationMode, location);
    } catch {}
  });
}

export async function startLiveTeamBackgroundLocation(session: { roomCode: string; name: string; transportationMode: TransportationMode }) {
  if (Platform.OS === 'web') return false;
  const available = await Location.isBackgroundLocationAvailableAsync();
  if (!available) return false;
  const foreground = await Location.getForegroundPermissionsAsync();
  if (!foreground.granted) return false;
  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) return false;
  await AsyncStorage.setItem(BACKGROUND_SESSION_KEY, JSON.stringify(session));
  if (await Location.hasStartedLocationUpdatesAsync(LIVE_TEAM_LOCATION_TASK)) return true;
  await Location.startLocationUpdatesAsync(LIVE_TEAM_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 10,
    timeInterval: 5000,
    deferredUpdatesDistance: 20,
    deferredUpdatesInterval: 15000,
    pausesUpdatesAutomatically: true,
    activityType: Location.ActivityType.OtherNavigation,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Vinago+ Live Team đang hoạt động',
      notificationBody: 'Đang chia sẻ vị trí với các thành viên trong đội.',
      killServiceOnDestroy: false,
    },
  });
  return true;
}

export async function stopLiveTeamBackgroundLocation() {
  if (Platform.OS === 'web') return;
  await AsyncStorage.removeItem(BACKGROUND_SESSION_KEY);
  if (await Location.hasStartedLocationUpdatesAsync(LIVE_TEAM_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LIVE_TEAM_LOCATION_TASK);
  }
}

export async function readLatestBackgroundLocation() {
  const value = await AsyncStorage.getItem(LAST_BACKGROUND_LOCATION_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as LiveTeamLocation; } catch { return null; }
}

export function shouldPublishLocation(previous: LiveTeamLocation | null, next: LiveTeamLocation) {
  if (!previous) return true;
  const elapsed = next.timestamp - previous.timestamp;
  const speed = Math.max(0, next.speed ?? 0);
  const minimumTime = speed > 8 ? 2500 : speed > 1 ? 5000 : 30000;
  return distanceMeters(previous, next) >= 10 || elapsed >= minimumTime;
}

export function distanceMeters(a: Pick<LiveTeamLocation, 'latitude' | 'longitude'>, b: Pick<LiveTeamLocation, 'latitude' | 'longitude'>) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
