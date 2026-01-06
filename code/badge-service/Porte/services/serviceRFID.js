const { startRFID, setOnTagCallback } = require("../Api/apiRFID.js");
const lcdService = require("./serviceLCD.js");

const SERVER_URL = `${process.env.NEXT_API_URL}/api/badge-scan/porte`;
const READER_ID = process.env.PORTE_READER_ID;

let lastTag = null;
let lastTime = 0;
async function handleTag(tag) {
    const now = Date.now();
    // Anti-doublon 2 secondes
    if (tag === lastTag && now - lastTime < 2000) return;

    lastTag = tag;
    lastTime = now;

    console.log("Badge détecté :", tag);

    try {
        const res = await fetch(SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                badgeId: tag,
                readerId: READER_ID
            })
        });

        if (!res.ok) {
            console.error(`Erreur HTTP: ${res.status}`);
            await lcdService.showMessage("Erreur serveur");
            return;
        }

        const data = await res.json();
        console.log("Réponse serveur :", data);

        if (data.allowed) {
            const msg = `Acces autorise`;
            console.log(msg);
            await lcdService.showMessage(msg);

        } else {
            console.log("Accès refusé");
            await lcdService.showMessage("Acces refuse");
        }


    } catch (err) {
        console.error("Erreur serveur :", err.message);
        await lcdService.showMessage("Erreur serveur");
    }
}

async function init() {
    // initialise le LCD d'abord
    lcdService.init();

    // configure le callback pour le RFID
    setOnTagCallback(handleTag);

    // démarre le RFID
    await startRFID();
    console.log("Service RFID initialisé");
}

module.exports = { init };
