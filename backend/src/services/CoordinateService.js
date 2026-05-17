const HttpError = require('../utils/HttpError');

class CoordinateService {
  static OPENROUTESERVICE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

  constructor({ httpClient, apiKey }) {
    this.httpClient = httpClient;
    this.apiKey = apiKey;
  }

  async calculateCarRoute(coordinates) {
    const apiResponse = await this.httpClient.post(
      CoordinateService.OPENROUTESERVICE_URL,
      { coordinates },
      {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!apiResponse.data) {
      throw new HttpError('Erro ao calcular rota na API externa', 502);
    }

    return apiResponse.data;
  }
}

module.exports = CoordinateService;
