const { startLCD, displayMessage } = require("../Api/apiLCD.js");

/**
 * Initialise le LCD
 */
async function init() {
    startLCD();
    console.log("LCD initialisé");
}

/**
 * Affiche un message sur le LCD
 * @param {string} message
 */
async function showMessage(message) {
    try {
        displayMessage(message);
    } catch (err) {
        console.error("Erreur LCD :", err.message);
    }
}

module.exports = {
    init,
    showMessage
};
