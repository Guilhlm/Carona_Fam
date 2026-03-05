const MapaService = require("../services/MapaService");
const { success } = require("../utils/response");

async function getRota(req, res, next) {
  try {
    const { coordenadas } = req.body;

    if (!coordenadas || !Array.isArray(coordenadas) || coordenadas.length < 2) {
      const err = new Error(
        "É necessário enviar um array com pelo menos 2 coordenadas.",
      );
      err.statusCode = 400;
      throw err;
    }

    const dadosBrutos = await MapaService.calcularRotaCarro(coordenadas);

    const rota = dadosBrutos.routes[0];
    const distanciaMetros = rota.summary.distance;
    const duracaoSegundos = rota.summary.duration;

    const distanciaKm = (distanciaMetros / 1000).toFixed(1);
    const tempoMinutos = Math.ceil(duracaoSegundos / 60);

    const coordsGoogle = coordenadas.map((ponto) => `${ponto[1]},${ponto[0]}`);
    const origem = coordsGoogle[0];
    const destino = coordsGoogle[coordsGoogle.length - 1];

    let waypoints = "";
    if (coordsGoogle.length > 2) {
      const paradasIntermediarias = coordsGoogle.slice(1, -1);
      waypoints = `&waypoints=${paradasIntermediarias.join("|")}`;
    }
    const linkGoogleMaps = `https://www.google.com/maps/dir/?api=1&origin=${origem}&destination=${destino}${waypoints}`;

    const respostaLimpa = {
      distanciaKm: Number(distanciaKm),
      tempoMinutos: Number(tempoMinutos),
      linkNavegacao: linkGoogleMaps,
      mapaPreview: {
        geometria: rota.geometry,
        limites: dadosBrutos.bbox,
      },
    };

    return success(res, respostaLimpa);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRota,
};
