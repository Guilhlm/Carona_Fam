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
        const err = new Error('It is necessary to provide an array with at least 2 coordinates.');
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
