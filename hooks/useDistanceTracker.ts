import * as Location from "expo-location";
import haversineDistance from "@/utils/haversineDistance"
import { useEffect, useState, useRef } from "react";

export function useDistanceTracker() {
  const [distance, setDistance] = useState(0); // meters
  const lastLocation = useRef<Location.LocationObjectCoords | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access location was denied");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // every 2 seconds
          distanceInterval: 1, // every 1 meter
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;

          if (lastLocation.current) {
            const d = haversineDistance(
              lastLocation.current.latitude,
              lastLocation.current.longitude,
              latitude,
              longitude
            );
            setDistance((prev) => prev + d);
          }

          lastLocation.current = loc.coords;
        }
      );
    })();

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  return distance;
}
