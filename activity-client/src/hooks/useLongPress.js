import { useCallback, useEffect, useRef } from "react";

/**
 * Distinguishes a tap from a long press.
 *
 * Built on Pointer Events, which is the whole point: mouse, touch and pen all
 * arrive through one stream. Listening to touch* and mouse* together — as this
 * did — double-counts every tap on a phone, because after `touchend` the browser
 * synthesises a compatibility `mousedown`/`mouseup` pair and the handler runs a
 * second time. That silently recorded two increments per tap.
 *
 * The rest of the behaviour it already had, kept: the fired flag is a ref so a
 * long press cannot also fire the tap, dragging cancels instead of registering,
 * and a pending timer is always cleared on unmount.
 */
export const useLongPress = ({ onPress, onLongPress, delay = 450, moveTolerance = 10 }) => {
  const timer = useRef(null);
  const longPressFired = useRef(false);
  const origin = useRef(null);
  const activeId = useRef(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(
    (event) => {
      // Secondary buttons and a second finger mid-gesture are not presses.
      if (event.button !== undefined && event.button !== 0) return;
      if (activeId.current !== null) return;

      activeId.current = event.pointerId;
      longPressFired.current = false;
      origin.current = { x: event.clientX, y: event.clientY };

      // Keep receiving events even if the finger drifts off the ring, so a tap
      // that wanders a few pixels still completes on this element.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture is an optimisation; the gesture works without it.
      }

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
      if (event.pointerId !== activeId.current || !timer.current || !origin.current) return;
      const dx = Math.abs(event.clientX - origin.current.x);
      const dy = Math.abs(event.clientY - origin.current.y);
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
      if (event.pointerId !== activeId.current) return;
      const hadTimer = Boolean(timer.current);
      clear();
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Already released, or never captured.
      }
      if (!longPressFired.current && hadTimer) onPress?.(event);
      longPressFired.current = false;
      origin.current = null;
      activeId.current = null;
    },
    [clear, onPress]
  );

  const cancel = useCallback(
    (event) => {
      if (event && event.pointerId !== activeId.current) return;
      clear();
      longPressFired.current = false;
      origin.current = null;
      activeId.current = null;
    },
    [clear]
  );

  return {
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: end,
    // Fired when the browser takes the gesture over for scrolling, which is
    // exactly when the press should stop counting.
    onPointerCancel: cancel,
    // Suppress the Android long-press context menu without killing text
    // selection elsewhere on the page.
    onContextMenu: (event) => event.preventDefault(),
  };
};
