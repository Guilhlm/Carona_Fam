class GeoUtils {
  static EARTH_RADIUS_KM = 6371;
  static AVG_URBAN_SPEED_KMH = 35;
  static URBAN_ROUTE_INFLATION_FACTOR = 1.25;

  static toNumberOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  static isValidLatitude(latitude) {
    return typeof latitude === 'number' && latitude >= -90 && latitude <= 90;
  }

  static isValidLongitude(longitude) {
    return typeof longitude === 'number' && longitude >= -180 && longitude <= 180;
  }

  static toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  static haversineKm(latitudeA, longitudeA, latitudeB, longitudeB) {
    const deltaLatitude = GeoUtils.toRadians(latitudeB - latitudeA);
    const deltaLongitude = GeoUtils.toRadians(longitudeB - longitudeA);
    const harvesineComponent =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(GeoUtils.toRadians(latitudeA)) *
        Math.cos(GeoUtils.toRadians(latitudeB)) *
        Math.sin(deltaLongitude / 2) ** 2;
    return 2 * GeoUtils.EARTH_RADIUS_KM * Math.asin(Math.sqrt(harvesineComponent));
  }

  static fallbackDistanceTime(coordinatePoints) {
    if (!Array.isArray(coordinatePoints) || coordinatePoints.length < 2) {
      return { distanceKm: 0, timeMin: 0 };
    }

    let cumulativeKm = 0;
    for (let pointIndex = 1; pointIndex < coordinatePoints.length; pointIndex++) {
      const [previousLng, previousLat] = coordinatePoints[pointIndex - 1];
      const [currentLng, currentLat] = coordinatePoints[pointIndex];
      cumulativeKm += GeoUtils.haversineKm(previousLat, previousLng, currentLat, currentLng);
    }

    const distanceKm = cumulativeKm * GeoUtils.URBAN_ROUTE_INFLATION_FACTOR;
    const timeMin = Math.ceil((distanceKm / GeoUtils.AVG_URBAN_SPEED_KMH) * 60);
    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      timeMin,
    };
  }

  static decimalToNumber(decimalValue) {
    if (decimalValue == null) return decimalValue;
    if (typeof decimalValue === 'object' && typeof decimalValue.toNumber === 'function') {
      return decimalValue.toNumber();
    }
    return Number(decimalValue);
  }
}

module.exports = GeoUtils;
