import { DigitalOutput } from "phidget22";

let greenLed: DigitalOutput | null = null;
let redLed: DigitalOutput | null = null;

export async function initLeds() {
    try {
        // Note: Channel numbers depend on your specific Phidget wiring.
        // Adjust 0 and 1 to match your hardware setup.
        greenLed = new DigitalOutput();
        greenLed.setChannel(0); 
        await greenLed.open(5000);

        redLed = new DigitalOutput();
        redLed.setChannel(1); 
        await redLed.open(5000);
    } catch (e) {
        console.error("Failed to init LEDs (Hardware might be missing):", e);
    }
}

export async function setLedGreen(state: boolean) {
    if (greenLed) {
        try {
            await greenLed.setState(state);
        } catch (e) {
            console.error("Error setting Green LED:", e);
        }
    }
}

export async function setLedRed(state: boolean) {
    if (redLed) {
        try {
            await redLed.setState(state);
        } catch (e) {
            console.error("Error setting Red LED:", e);
        }
    }
}
