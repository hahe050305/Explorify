// src/context/LocationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Platform,
  PermissionsAndroid,
  AppState,
  AppStateStatus,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// Configure Geolocation module for modern React Native architecture
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
  enableBackgroundLocationUpdates: false,
});

type Coordinates = { latitude: number; longitude: number } | null;

type LocationInfo = {
  coordinates: Coordinates;
  address: string | null;
};

type LocationContextType = {
  location: LocationInfo;
  requestLocation: () => Promise<void>;
  loading: boolean;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [location, setLocation] = useState<LocationInfo>({
    coordinates: null,
    address: null,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const isFetchingRef = useRef(false);
  const lastResolvedCoordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const lastGeocodeTimeRef = useRef<number>(0);

  /**
   * Request Android runtime permissions.
   * Android 12+ (API 31+) mandates requesting ACCESS_FINE_LOCATION and
   * ACCESS_COARSE_LOCATION together via requestMultiple.
   */
  const checkOrRequestPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const fineCheck = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      const coarseCheck = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );

      if (fineCheck || coarseCheck) {
        return true;
      }

      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      return (
        result['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED ||
        result['android.permission.ACCESS_COARSE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Location permission check/request failed:', err);
      return false;
    }
  };

  /**
   * Resilient Reverse Geocoding:
   * 1. Primary: OpenStreetMap Nominatim (universal, works anywhere)
   * 2. Fallback: BigDataCloud Reverse Geocode Client (free, high availability, fast)
   * 3. Tertiary fallback: Formatted coordinate string so UI never gets stuck
   */
  const reverseGeocode = async (
    lat: number,
    lon: number
  ): Promise<string | null> => {
    // 1. Nominatim OpenStreetMap
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ExplorifyApp/1.0 (contact@explorifyapp.com)',
            Accept: 'application/json',
          },
        }
      );

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.address && !data.error) {
          const addr = data.address;
          const area =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.subdistrict ||
            addr.county;
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.state_district;
          const parts = [area, city].filter(Boolean);
          if (parts.length > 0) {
            return parts.join(', ');
          }
          if (data.display_name) {
            const split = data.display_name.split(',');
            return split
              .slice(0, 2)
              .map((s: string) => s.trim())
              .join(', ');
          }
        }
      }
    } catch (e) {
      // Nominatim failed or timed out, continue to fallback
    }

    // 2. BigDataCloud Reverse Geocode Client fallback
    try {
      const resp = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (resp.ok) {
        const data = await resp.json();
        if (data) {
          const area = data.locality || data.principalSubdivision;
          const city = data.city || data.locality;
          const parts = Array.from(new Set([area, city].filter(Boolean)));
          if (parts.length > 0) {
            return (parts as string[]).join(', ');
          }
        }
      }
    } catch (e) {
      // Continue to fallback
    }

    // 3. Fallback: Clean readable coordinates
    return `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`;
  };

  /**
   * Handle incoming coordinates from any provider (GPS, Network, watch).
   *
   * FIX: The fetch lock (isFetchingRef) and loading state are ALWAYS released
   * at the top of this function, before any guards run. Previously, the two
   * early-return guards (dedup + throttle) would exit without releasing the
   * lock, permanently deadlocking all future requestLocation() calls after the
   * first successful fetch.
   *
   * The guards now only control whether a reverse-geocode API call is made —
   * they no longer affect the fetch lifecycle.
   */
  const handlePositionSuccess = useCallback(
    async (pos: { coords: { latitude: number; longitude: number } }) => {
      // ✅ Always release the fetch lock immediately — never let a guard hold it
      isFetchingRef.current = false;
      setLoading(false);

      const { latitude, longitude } = pos.coords;

      // Guard: skip re-geocoding if coordinates haven't shifted ~50m
      const last = lastResolvedCoordsRef.current;
      if (last) {
        const dLat = Math.abs(last.lat - latitude);
        const dLon = Math.abs(last.lon - longitude);
        if (dLat < 0.0005 && dLon < 0.0005) {
          return;
        }
      }

      // Guard: throttle geocode API calls — respect rate limits (min 3s between calls)
      const now = Date.now();
      if (now - lastGeocodeTimeRef.current < 3000) {
        return;
      }

      lastGeocodeTimeRef.current = now;
      lastResolvedCoordsRef.current = { lat: latitude, lon: longitude };

      const address = await reverseGeocode(latitude, longitude);
      setLocation({
        coordinates: { latitude, longitude },
        address: address || `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`,
      });
    },
    []
  );

  /**
   * Fetch current location using two-stage strategy:
   * 1. Fast Network / cached provider (<500ms)
   * 2. High-accuracy GPS provider (refinement)
   */
  const requestLocation = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    const hasPerm = await checkOrRequestPermission();
    if (!hasPerm) {
      isFetchingRef.current = false;
      setLoading(false);
      return;
    }

    // Stage 1: Fast network fix
    Geolocation.getCurrentPosition(
      (pos) => {
        handlePositionSuccess(pos);
      },
      (_err) => {
        // Stage 1 failed — release lock before stage 2 so it can re-acquire it
        isFetchingRef.current = false;

        // Stage 2: Fallback to high-accuracy GPS
        requestLocation();
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  }, [handlePositionSuccess]);

  /**
   * High-accuracy GPS fallback, called internally when the fast-network stage fails.
   * Separated from requestLocation to avoid infinite recursion while keeping
   * the two-stage approach intact.
   */
  const requestLocationHighAccuracy = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    Geolocation.getCurrentPosition(
      (pos) => {
        handlePositionSuccess(pos);
      },
      (_gpsErr) => {
        isFetchingRef.current = false;
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  }, [handlePositionSuccess]);

  // Patch requestLocation to use the separated high-accuracy fallback
  const requestLocationWithFallback = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    const hasPerm = await checkOrRequestPermission();
    if (!hasPerm) {
      isFetchingRef.current = false;
      setLoading(false);
      return;
    }

    // Stage 1: Fast network fix
    Geolocation.getCurrentPosition(
      (pos) => {
        handlePositionSuccess(pos);
      },
      (_err) => {
        // Stage 1 failed — release lock, then try high-accuracy GPS
        isFetchingRef.current = false;
        setLoading(false);
        requestLocationHighAccuracy();
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  }, [handlePositionSuccess, requestLocationHighAccuracy]);

  /**
   * Continuous Location Detection (Pre, Mid, Post app launch):
   * 1. Initial trigger on app start
   * 2. Native watchPosition listener: OS pushes new fix when GPS turns ON
   * 3. AppState listener: triggers when user enables GPS and returns to app
   * 4. Gentle poll: checks every 4s if coordinates are still unresolved
   */
  useEffect(() => {
    let watchId: number | null = null;
    let pollTimer: NodeJS.Timeout | null = null;

    const initLocation = async () => {
      const hasPerm = await checkOrRequestPermission();
      if (!hasPerm) return;

      // Initial fetch
      requestLocationWithFallback();

      // Native watchPosition listener
      try {
        watchId = Geolocation.watchPosition(
          (pos) => {
            handlePositionSuccess(pos);
          },
          (_err) => {
            // Silently ignore temporary unavailability until GPS turns on
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 15,
            interval: 5000,
            fastestInterval: 2000,
          }
        );
      } catch (e) {
        console.warn('Geolocation watchPosition setup error:', e);
      }
    };

    initLocation();

    // AppState change listener (e.g. user pulled down quick settings to enable GPS)
    const appStateSub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          requestLocationWithFallback();
        }
      }
    );

    // Gentle poller — only fires while location is unresolved
    pollTimer = setInterval(() => {
      if (!lastResolvedCoordsRef.current) {
        requestLocationWithFallback();
      }
    }, 4000);

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      appStateSub.remove();
    };
  }, [requestLocationWithFallback, handlePositionSuccess]);

  return (
    <LocationContext.Provider
      value={{ location, requestLocation: requestLocationWithFallback, loading }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return ctx;
};