import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type AppCoordinates = {
  lat: number;
  lng: number;
  accuracy: number | null;
  timestamp: number;
};

export type AppLocationPermission = 'checking' | 'undetermined' | 'granted' | 'denied';

function toCoordinates(location: Location.LocationObject): AppCoordinates {
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    accuracy: location.coords.accuracy,
    timestamp: location.timestamp,
  };
}

export function useAppLocation() {
  const [permission, setPermission] = useState<AppLocationPermission>('checking');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [coordinates, setCoordinates] = useState<AppCoordinates | null>(null);
  const [cityLabel, setCityLabel] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCityLabel = useCallback(async (next: AppCoordinates) => {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: next.lat,
        longitude: next.lng,
      });
      setCityLabel(address?.city || address?.district || address?.subregion || address?.region || null);
    } catch {
      setCityLabel(null);
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    setIsLocating(true);
    setError(null);
    let cachedCoordinates: AppCoordinates | null = null;
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError('Location services are turned off on this device.');
        return null;
      }

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 2_000,
      });
      if (lastKnown) {
        cachedCoordinates = toCoordinates(lastKnown);
        setCoordinates(cachedCoordinates);
        void updateCityLabel(cachedCoordinates);
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = toCoordinates(current);
      setCoordinates(next);
      void updateCityLabel(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not determine your current location.');
      return cachedCoordinates;
    } finally {
      setIsLocating(false);
    }
  }, [updateCityLabel]);

  const requestLocation = useCallback(async () => {
    setIsLocating(true);
    setError(null);
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      setCanAskAgain(result.canAskAgain);
      if (result.status !== Location.PermissionStatus.GRANTED) {
        setPermission('denied');
        setError('Location permission was not granted.');
        return null;
      }
      setPermission('granted');
      return await refreshLocation();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not request location permission.');
      return null;
    } finally {
      setIsLocating(false);
    }
  }, [refreshLocation]);

  const syncPermission = useCallback(async () => {
    try {
      const result = await Location.getForegroundPermissionsAsync();
      setCanAskAgain(result.canAskAgain);
      if (result.status === Location.PermissionStatus.GRANTED) {
        setPermission('granted');
        return await refreshLocation();
      } else if (result.status === Location.PermissionStatus.DENIED) {
        setPermission('denied');
      } else {
        setPermission('undetermined');
      }
      return null;
    } catch (nextError) {
      setPermission('undetermined');
      setError(nextError instanceof Error ? nextError.message : 'Could not check location permission.');
      return null;
    }
  }, [refreshLocation]);

  useEffect(() => {
    void syncPermission();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncPermission();
    });
    return () => subscription.remove();
  }, [syncPermission]);

  return {
    canAskAgain,
    cityLabel,
    coordinates,
    error,
    isLocating,
    permission,
    refreshLocation,
    requestLocation,
  };
}
