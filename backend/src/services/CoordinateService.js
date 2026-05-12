class CoordinateService {
  constructor({ httpClient, apiKey }) {
    this.httpClient = httpClient;
    this.apiKey = apiKey;
    this.url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
  }

  async calculateCarRoute(coordinates) {
    const response = await this.httpClient.post(
      this.url,
      {
        coordinates,
      },
      {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data) {
      const err = new Error('Error calculating route on external API');
      err.statusCode = 502;
      throw err;
    }

    return response.data;
  }
}

module.exports = CoordinateService;
