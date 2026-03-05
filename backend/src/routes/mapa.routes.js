const express = require("express");
const MapaController = require("../controllers/MapaController");

const router = express.Router();

router.post("/rota", MapaController.getRota);

module.exports = router;
