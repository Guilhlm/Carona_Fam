const coordinateService = require('../services/coordinate');
const { success } = require('../utils/response');

class CoordinateController {
  constructor(service) {
    this.service = service;
  }

  getRoute = async (req, res, next) => {
    try {
      const { coordinates } = req.body;

      if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
        const err = new Error(
          'É necessário informar um array de coordenadas com pelo menos 2 pontos.'
        );
        err.statusCode = 400;
        throw err;
      }

      const hasInvalidCoordinate = coordinates.some((point) => {
        if (!Array.isArray(point) || point.length !== 2) return true;
        const [lon, lat] = point.map(Number);
        if (Number.isNaN(lat) || Number.isNaN(lon)) return true;
        if (lat < -90 || lat > 90) return true;
        if (lon < -180 || lon > 180) return true;
        return false;
      });

      if (hasInvalidCoordinate) {
        const err = new Error(
          'Cada coordenada deve conter longitude e latitude válidas no formato [lon, lat].'
        );
        err.statusCode = 400;
        throw err;
      }

      const rawData = await this.service.calculateCarRoute(coordinates);
      const route = rawData.features[0];
      const distanceKm = (route.properties.summary.distance / 1000).toFixed(1);
      const timeMinutes = Math.ceil(route.properties.summary.duration / 60);

      const cleanResponse = {
        distanceKm: Number(distanceKm),
        timeMinutes: Number(timeMinutes),
        mapPreview: {
          geometry: route.geometry,
          bounds: rawData.bbox,
        },
      };

      return success(res, cleanResponse);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new CoordinateController(coordinateService);
