const phidget22 = require("phidget22");

let rfid = null;
let onTagCallback = null;

function setOnTagCallback(cb) {
    onTagCallback = cb;
}

async function startRFID() {
    const conn = new phidget22.NetworkConnection(5661, "localhost");
    await conn.connect();

    console.log("Connecté au Phidget Network Server");

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

    rfid.onTagLost = () => {};

    await rfid.open(5000);
    console.log("RFID prêt");
}
async function retournerID() {
    return rfid.deviceSerialNumber;
}
module.exports = {
    startRFID,
    setOnTagCallback,
    retournerID
};
