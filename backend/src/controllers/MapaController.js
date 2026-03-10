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

    const rota = dadosBrutos.features[0];
    const distanciaKm = (rota.properties.summary.distance / 1000).toFixed(1);
    const tempoMinutos = Math.ceil(rota.properties.summary.duration / 60);

    const respostaLimpa = {
      distanciaKm: Number(distanciaKm),
      tempoMinutos: Number(tempoMinutos),
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
