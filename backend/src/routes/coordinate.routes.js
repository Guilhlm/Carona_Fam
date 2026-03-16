const express = require("express");
const CoordinateController = require("../controllers/CoordinateController");

const router = express.Router();

router.post("/route", CoordinateController.getRoute);

module.exports = router;
