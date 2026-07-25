import { useCallback, useEffect, useRef } from "react";

/**
 * Distinguishes a tap from a long press on both touch and mouse.
 *
 * Fixes three defects in the version this replaces: the fired/not-fired flag is
 * a ref rather than state (so a long press cannot also fire the tap), dragging
 * cancels instead of registering a tap on release, and a pending timer is always
 * cleared on unmount rather than firing into a dead component.
 */
export const useLongPress = ({ onPress, onLongPress, delay = 450, moveTolerance = 10 }) => {
  const timer = useRef(null);
  const longPressFired = useRef(false);
  const origin = useRef(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(
    (event) => {
      // Ignore secondary mouse buttons.
      if (event.type === "mousedown" && event.button !== 0) return;

      longPressFired.current = false;
      const point = event.touches?.[0] ?? event;
      origin.current = { x: point.clientX, y: point.clientY };

      clear();
      timer.current = setTimeout(() => {
        longPressFired.current = true;
        timer.current = null;
        onLongPress?.(event);
      }, delay);
    },
    [clear, delay, onLongPress]
  );

  const move = useCallback(
    (event) => {
      if (!timer.current || !origin.current) return;
      const point = event.touches?.[0] ?? event;
      const dx = Math.abs(point.clientX - origin.current.x);
      const dy = Math.abs(point.clientY - origin.current.y);
      // The user is scrolling, not pressing.
      if (dx > moveTolerance || dy > moveTolerance) {
        clear();
        longPressFired.current = true;
      }
    },
    [clear, moveTolerance]
  );

  const end = useCallback(
    (event) => {
      const hadTimer = Boolean(timer.current);
      clear();
      if (!longPressFired.current && hadTimer) onPress?.(event);
      longPressFired.current = false;
      origin.current = null;
    },
    [clear, onPress]
  );

  const cancel = useCallback(() => {
    clear();
    longPressFired.current = false;
    origin.current = null;
  }, [clear]);

  return {
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onTouchCancel: cancel,
    // Suppress the Android long-press context menu without killing text select
    // elsewhere on the page.
    onContextMenu: (event) => event.preventDefault(),
  };
};
