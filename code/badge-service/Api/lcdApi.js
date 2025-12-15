
const phidget22 = require("phidget22");

let lcd;

async function startLCD() {
    lcd = new phidget22.LCD();

    lcd.onAttach = () => {
        console.log("LCD connecté !");
        lcd.setBacklight(1.0);
    };

    try {
        await lcd.open(5000);
        console.log("LCD prêt !");
        await lcd.clear();
        await lcd.writeText(phidget22.LCDFont.DIMENSIONS_5X8, 0, 0, "bonjour");
        await lcd.flush();
    } catch (err) {
        console.error("Erreur LCD:", err);
    }
}

async function afficherMessage(message, x = 0, y = 0, fontKey = "DIMENSIONS_5X8") {
    if (!lcd) return;
    try {
        const font = phidget22.LCDFont[fontKey] || phidget22.LCDFont.DIMENSIONS_5X8;
        await lcd.writeText(font, x, y, message);
        await lcd.flush();
    } catch (err) {
        console.error("Erreur displayMessage:", err);
    }
}

module.exports = { startLCD, afficherMessage };
