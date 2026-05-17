import L from 'leaflet';

export const DEFAULT_MAP_VIEWPORT_PADDING = {
  top: 280,
  bottom: 200,
  left: 32,
  right: 32,
};

export function computeMapViewportPadding(mapElement, topEndElement, bottomStartElement, horizontalPadding = 32) {
  if (!mapElement || !topEndElement || !bottomStartElement) {
    return { ...DEFAULT_MAP_VIEWPORT_PADDING };
  }

  const mapBoundingRect = mapElement.getBoundingClientRect();
  const topBoundingRect = topEndElement.getBoundingClientRect();
  const bottomBoundingRect = bottomStartElement.getBoundingClientRect();

  return {
    top: Math.max(16, Math.round(topBoundingRect.bottom - mapBoundingRect.top)),
    bottom: Math.max(16, Math.round(mapBoundingRect.bottom - bottomBoundingRect.top)),
    left: horizontalPadding,
    right: horizontalPadding,
  };
}

export function toLeafletFitPadding(viewportPadding) {
  return {
    paddingTopLeft: L.point(viewportPadding.left, viewportPadding.top),
    paddingBottomRight: L.point(viewportPadding.right, viewportPadding.bottom),
  };
}

export function getVisibleCenterPanOffset(viewportPadding) {
  return L.point(
    (viewportPadding.right - viewportPadding.left) / 2,
    (viewportPadding.bottom - viewportPadding.top) / 2
  );
}

export function panToVisibleCenter(mapInstance, viewportPadding, { animate = true } = {}) {
  const panOffset = getVisibleCenterPanOffset(viewportPadding);
  if (panOffset.x || panOffset.y) {
    mapInstance.panBy(panOffset, { animate });
  }
}

export function flyToVisibleCenter(mapInstance, targetLatLng, targetZoom, viewportPadding, options = {}) {
  const { duration = 0.45 } = options;
  mapInstance.flyTo(L.latLng(targetLatLng), targetZoom, { duration });

  mapInstance.once('moveend', () => {
    panToVisibleCenter(mapInstance, viewportPadding, { animate: duration > 0 });
  });
}

export function fitMapToPoints(mapInstance, points, viewportPadding, { maxZoom = 16, animate = true } = {}) {
  const validPoints = (points || []).filter((point) => Array.isArray(point) && point.length === 2);
  if (validPoints.length === 0) return;

  if (validPoints.length === 1) {
    mapInstance.setView(validPoints[0], Math.min(maxZoom, 15), { animate });
    mapInstance.once('moveend', () => {
      panToVisibleCenter(mapInstance, viewportPadding, { animate });
    });
    return;
  }

  const latLngBounds = L.latLngBounds(validPoints);
  mapInstance.fitBounds(latLngBounds, {
    ...toLeafletFitPadding(viewportPadding),
    maxZoom,
    animate,
  });
}
