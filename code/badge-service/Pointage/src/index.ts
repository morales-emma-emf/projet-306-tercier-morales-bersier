import { RFID, Connection } from "phidget22";
import fetch from "node-fetch";
import { initLeds, setLedGreen, setLedRed } from "./phidget";
import * as dotenv from "dotenv";

dotenv.config();

const NEXT_API_URL = process.env.NEXT_API_URL || "http://localhost:3000";

async function main() {
  try {
    // Connect to Phidget server (local)
    // Ensure Phidget Control Panel is running and Network Server is enabled
    const conn = new Connection(5661, "localhost");
    await conn.connect();
    console.log("Connected to Phidget server");

    // Init LEDs
    await initLeds();

    // Init RFID
    const reader = new RFID();
    
    reader.onAttach = () => {
      console.log("RFID Reader attached");
    };

    reader.onDetach = () => {
      console.log("RFID Reader detached");
    };

    reader.onTag = async (tag: string) => {
      console.log("Badge détecté :", tag);

      try {
        const res = await fetch(`${NEXT_API_URL}/api/badge-scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            badgeId: tag,
            readerId: "READER_1",
            timestamp: new Date().toISOString(),
          }),
        });

        if (!res.ok) {
            throw new Error(`API responded with ${res.status}`);
        }

        const data = await res.json() as { allowed: boolean };
        console.log("Réponse API :", data);

        if (data.allowed) {
          await setLedGreen(true);
          await setLedRed(false);
          // Turn off after 2s
          setTimeout(() => setLedGreen(false), 2000); 
        } else {
          await setLedGreen(false);
          await setLedRed(true);
          // Turn off after 2s
          setTimeout(() => setLedRed(false), 2000); 
        }
      } catch (err) {
        console.error("Erreur API :", err);
        // Fallback: Blink red
        await setLedGreen(false);
        await setLedRed(true);
        setTimeout(() => setLedRed(false), 500);
      }
    };

    // Open RFID reader (any channel)
    await reader.open(5000);
    console.log("RFID Reader opened and listening...");

  } catch (err) {
    console.error("Fatal error:", err);
  }
}

main();
