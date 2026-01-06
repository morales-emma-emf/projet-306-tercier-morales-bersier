const phidget22 = require("phidget22");

let rfid = null;
let onTagCallback = null;

function setOnTagCallback(cb) {
    onTagCallback = cb;
}

async function startRFID() {
    try {
        const conn = new phidget22.NetworkConnection(5661, "localhost");
        await conn.connect();
        console.log("Connecté au Phidget Network Server (via RFID)");
    } catch (err) {
        console.log("Info connexion serveur (RFID):", err.message);
    }

    // Tentative de connexion directe ou via serveur si disponible, sans échouer si le serveur est absent
    try {
        rfid = new phidget22.RFID();

        rfid.onAttach = () => {
            console.log("RFID connecté");
        };

        rfid.onTag = (tag) => {
            console.log("Tag détecté:", tag);
            if (onTagCallback) {
                onTagCallback(tag);
            }
        };

        rfid.onTagLost = () => { };

        await rfid.open(5000);
        console.log("RFID prêt");
    } catch (err) {
        console.error("Erreur d'initialisation RFID (Le serveur Phidget est-il lancé ?):", err.message);
    }
}

module.exports = {
    startRFID,
    setOnTagCallback
};
