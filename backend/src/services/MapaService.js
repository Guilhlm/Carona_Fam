const axios = require("axios");

async function calcularRotaCarro(coordenadas) {
  const url =
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

  const response = await axios.post(
    url,
    {
      coordinates: coordenadas,
    },
    {
      headers: {
        Authorization: process.env.ORS_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.data) {
    const err = new Error("Erro ao calcular rota na API externa");
    err.statusCode = 502;
    throw err;
  }

  return response.data;
}

module.exports = {
  calcularRotaCarro,
};
