const express = require("express");
const rfidService = require("./services/serviceRFID");

const app = express();
app.use(express.json());

// routes optionnelles
// app.use("/api", require("./routes/rfid.routes"));

async function start() {
    await rfidService.init();
    console.log("Badge-service prêt");
}

start();
