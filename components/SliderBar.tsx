// SliderBar.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";

type SliderBarProps = {
  range: [number, number];
  rangeBar?: boolean;
  label?: string;
  description?: string;
  displayValue?: boolean;
  step?: number;
  onValueChange?: (value: number | [number, number]) => void;
  initialValue?: number;
  initialValues?: [number, number];
};

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 30;

export default function SliderBar({
  range,
  rangeBar = false,
  label,
  description,
  displayValue = false,
  step = 1,
  onValueChange,
  initialValue,
  initialValues,
}: SliderBarProps) {
  const [trackWidth, setTrackWidth] = useState<number>(0);

  // normalized min/max (support inverted ranges)
  const minValue = Math.min(range[0], range[1]);
  const maxValue = Math.max(range[0], range[1]);
  const span = Math.max(1, maxValue - minValue);

  // logical values
  const [singleValue, setSingleValue] = useState<number>(
    typeof initialValue === "number" ? initialValue : minValue
  );
  const [rangeValues, setRangeValues] = useState<[number, number]>(
    initialValues ?? [minValue, maxValue]
  );

  // pixel positions for thumbs (0..trackWidth)
  const [thumb1X, setThumb1XState] = useState<number>(0);
  const [thumb2X, setThumb2XState] = useState<number>(trackWidth);

  // refs to keep latest values for pan handlers (avoid stale closures)
  const thumb1XRef = useRef<number>(thumb1X);
  const thumb2XRef = useRef<number>(thumb2X);
  const singleValueRef = useRef<number>(singleValue);
  const rangeValuesRef = useRef<[number, number]>(rangeValues);

  useEffect(() => {
    thumb1XRef.current = thumb1X;
  }, [thumb1X]);
  useEffect(() => {
    thumb2XRef.current = thumb2X;
  }, [thumb2X]);
  useEffect(() => {
    singleValueRef.current = singleValue;
  }, [singleValue]);
  useEffect(() => {
    rangeValuesRef.current = rangeValues;
  }, [rangeValues]);

  // helpers
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const valueToPosition = (val: number) => {
    if (trackWidth <= 0) return 0;
    const ratio = (val - minValue) / span;
    return ratio * trackWidth;
  };

  const positionToValue = (pos: number) => {
    if (trackWidth <= 0) return minValue;
    const ratio = clamp(pos / trackWidth, 0, 1);
    const raw = minValue + ratio * span;
    const stepped = Math.round(raw / step) * step;
    return clamp(stepped, minValue, maxValue);
  };

  // set state + refs helpers
  const setThumb1X = (x: number) => {
    thumb1XRef.current = x;
    setThumb1XState(x);
  };
  const setThumb2X = (x: number) => {
    thumb2XRef.current = x;
    setThumb2XState(x);
  };
  const setSingle = (v: number) => {
    singleValueRef.current = v;
    setSingleValue(v);
  };
  const setRange = (v: [number, number]) => {
    rangeValuesRef.current = v;
    setRangeValues(v);
  };

  // Initialize positions when track width changes
  useEffect(() => {
    if (trackWidth <= 0) return;

    if (rangeBar) {
      const p1 = valueToPosition(rangeValues[0]);
      const p2 = valueToPosition(rangeValues[1]);
      setThumb1X(p1);
      setThumb2X(p2);
    } else {
      const p = valueToPosition(singleValue);
      setThumb1X(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackWidth]);

  // Keep positions in sync if logical values changed from props externally
  useEffect(() => {
    if (trackWidth <= 0) return;
    setThumb1X(valueToPosition(rangeBar ? rangeValues[0] : singleValue));
    if (rangeBar) setThumb2X(valueToPosition(rangeValues[1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleValue, rangeValues]);

  // Helper to compute formatted text
  const formatted = () => {
    if (rangeBar) {
      return `${rangeValues[0]}${label ? ` ${label}` : ""} - ${rangeValues[1]}${label ? ` ${label}` : ""}`;
    }
    return `${singleValue}${label ? ` ${label}` : ""}`;
  };

  // Pan responders (constructed once)
  const startXRef = useRef<number>(0);

  const createPanResponderForThumb =
    (thumbIndex: 0 | 1 | "single") =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (
          _evt: GestureResponderEvent,
          _gs: PanResponderGestureState
        ) => {
          // record starting pixel position for the touched thumb
          if (thumbIndex === "single") startXRef.current = thumb1XRef.current;
          else startXRef.current = thumbIndex === 0 ? thumb1XRef.current : thumb2XRef.current;
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (trackWidth <= 0) return;
          let newX = startXRef.current + gestureState.dx;
          newX = clamp(newX, 0, trackWidth);

          const newVal = positionToValue(newX);

          if (rangeBar) {
            const cur = rangeValuesRef.current.slice() as [number, number];
            if (thumbIndex === 0) {
              // left thumb cannot exceed right thumb
              const clampedVal = Math.min(newVal, cur[1]);
              cur[0] = clampedVal;
              setRange(cur);
              setThumb1X(valueToPosition(clampedVal));
              onValueChange?.(cur);
            } else {
              // right thumb cannot be below left thumb
              const clampedVal = Math.max(newVal, cur[0]);
              cur[1] = clampedVal;
              setRange(cur);
              setThumb2X(valueToPosition(clampedVal));
              onValueChange?.(cur);
            }
          } else {
            const clamped = clamp(newVal, minValue, maxValue);
            setSingle(clamped);
            setThumb1X(valueToPosition(clamped));
            onValueChange?.(clamped);
          }
        },
        onPanResponderRelease: () => { /* nothing special on release */ },
        onPanResponderTerminationRequest: () => false,
      });

  // create once
  const panSingle = useRef(createPanResponderForThumb("single")).current;
  const panLeft = useRef(createPanResponderForThumb(0)).current;
  const panRight = useRef(createPanResponderForThumb(1)).current;

  // track layout
  const onLayoutTrack = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
  };

  // computed styles for highlight and thumbs (numbers)
  const highlightLeft = rangeBar ? Math.min(thumb1X, thumb2X) : 0;
  const highlightWidth = rangeBar ? Math.abs(thumb2X - thumb1X) : thumb1X;

  return (
    <View style={styles.container}>
      <View style={styles.trackWrap} onLayout={onLayoutTrack}>
        <View style={styles.trackBackground} />

        {/* highlighted part */}
        <View style={[styles.highlight, { left: highlightLeft, width: highlightWidth }]} />

        {/* thumbs */}
        {!rangeBar ? (
          <View
            {...panSingle.panHandlers}
            style={[
              styles.thumb,
              { left: thumb1X - THUMB_SIZE / 2 },
            ]}
          />
        ) : (
          <>
            <View
              {...panLeft.panHandlers}
              style={[styles.thumb, { left: thumb1X - THUMB_SIZE / 2 }]}
            />
            <View
              {...panRight.panHandlers}
              style={[styles.thumb, { left: thumb2X - THUMB_SIZE / 2 }]}
            />
          </>
        )}
      </View>

      {displayValue ? (
        <Text style={styles.description}>
          {description ? `${description}: ${formatted()}` : formatted()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
  },
  trackWrap: {
    width: "100%",
    height: THUMB_SIZE,
    justifyContent: "center",
  },
  trackBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: "#E6EAF2",
  },
  highlight: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: "#2563EB", // modern blue
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#2563EB",
    top: (THUMB_SIZE - TRACK_HEIGHT) / -2,
    // shadow
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 4,
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
});
