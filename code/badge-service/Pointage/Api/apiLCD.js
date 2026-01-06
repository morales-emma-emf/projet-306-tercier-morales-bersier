
const phidget22 = require("phidget22");

let lcd;

async function startLCD() {
    // Connexion explicite au serveur si nécessaire
    try {
        const conn = new phidget22.NetworkConnection(5661, "localhost");
        await conn.connect();
        console.log("Connecté au Phidget Network Server (via LCD)");
    } catch (err) {
        // Ignorer si déjà connecté ou erreur légère, on essaiera d'ouvrir le LCD quand même
        console.log("Info connexion serveur (LCD):", err.message);
    }

    lcd = new phidget22.LCD();

    lcd.onAttach = () => {
        console.log("LCD connecté !");
        lcd.setBacklight(1.0);
    };

    try {
        await lcd.open(5000);
        console.log("LCD prêt !");
        await lcd.clear();
        await lcd.writeText(phidget22.LCDFont.DIMENSIONS_5X8, 0, 0, "scannez votre badge");
        await lcd.flush();
    } catch (err) {
        console.error("Erreur LCD:", err);
    }
}

async function displayMessage(message1, message2) {
    if (!lcd) return;
    try {
        const font = phidget22.LCDFont["DIMENSIONS_5X8"] || phidget22.LCDFont.DIMENSIONS_5X8;
        lcd.clear();
        await lcd.writeText(font, 0, 0, message1);
        await lcd.writeText(font, 1, 0, message2);

        await lcd.flush();
    } catch (err) {
        console.error("Erreur displayMessage:", err);
    }
}

module.exports = { startLCD, displayMessage };
