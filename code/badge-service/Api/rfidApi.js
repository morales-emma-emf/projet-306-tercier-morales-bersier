const phidget22 = require("phidget22");

let lastTag = "Aucun tag détecté";
let id = ""
export async function startRFID() {
    const conn = new phidget22.NetworkConnection(5661, "localhost");

    try {
        await conn.connect();
        console.log("Connecté au Phidget Network Server");
    } catch (err) {
        console.error("Erreur de connexion Phidget:", err);
        return;
    }

    const rfid = new phidget22.RFID();
    id = rfid.deviceSerialNumber
    rfid.onAttach = () => {
        console.log("RFID connecté !");
    };

    rfid.onTag = (tag) => {
        console.log("Tag détecté:", tag);
        lastTag = tag;
    };

    rfid.onTagLost = (tag) => {
        console.log("Tag retiré:", tag);
    };

    try {
        await rfid.open(5000);
        console.log("RFID prêt !");
    } catch (err) {
        console.error("Erreur RFID:", err);
    }
}
export function getIDPorte(){
    return id;
}
export function getLastTag() {
    return lastTag;
}
