const axios = require('axios');
const CoordinateService = require('../CoordinateService');

const coordinateService = new CoordinateService({
  httpClient: axios,
  apiKey: process.env.ORS_API_KEY,
});

module.exports = coordinateService;
