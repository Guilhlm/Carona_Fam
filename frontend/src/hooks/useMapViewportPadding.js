import { useCallback, useEffect, useState } from 'react';
import {
  computeMapViewportPadding,
  DEFAULT_MAP_VIEWPORT_PADDING,
} from '../utils/mapViewport';

export function useMapViewportPadding(mapContainerRef, topEndRef, bottomStartRef) {
  const [padding, setPadding] = useState(DEFAULT_MAP_VIEWPORT_PADDING);

  const updatePadding = useCallback(() => {
    const mapElement = mapContainerRef.current;
    const topElement = topEndRef.current;
    const bottomElement = bottomStartRef.current;
    const nextPadding = computeMapViewportPadding(mapElement, topElement, bottomElement);
    setPadding((previousPadding) =>
      previousPadding.top === nextPadding.top &&
      previousPadding.bottom === nextPadding.bottom &&
      previousPadding.left === nextPadding.left &&
      previousPadding.right === nextPadding.right
        ? previousPadding
        : nextPadding
    );
  }, [mapContainerRef, topEndRef, bottomStartRef]);

  useEffect(() => {
    updatePadding();

    const mapElement = mapContainerRef.current;
    if (!mapElement) return undefined;

    const resizeObserver = new ResizeObserver(() => {
      updatePadding();
    });

    resizeObserver.observe(mapElement);
    if (topEndRef.current) resizeObserver.observe(topEndRef.current);
    if (bottomStartRef.current) resizeObserver.observe(bottomStartRef.current);

    window.addEventListener('resize', updatePadding);
    window.addEventListener('scroll', updatePadding, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePadding);
      window.removeEventListener('scroll', updatePadding, true);
    };
  }, [mapContainerRef, topEndRef, bottomStartRef, updatePadding]);

  return padding;
}
