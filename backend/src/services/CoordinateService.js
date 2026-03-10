const axios = require("axios");

async function calculateCarRoute(coordinates) {
  const url =
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

  const response = await axios.post(
    url,
    {
      coordinates,
    },
    {
      headers: {
        Authorization: process.env.ORS_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.data) {
    const err = new Error("Error calculating route on external API");
    err.statusCode = 502;
    throw err;
  }

  return response.data;
}

module.exports = {
  calculateCarRoute,
};
