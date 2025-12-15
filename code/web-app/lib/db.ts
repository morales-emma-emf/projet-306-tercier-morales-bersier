import mysql from "mysql2/promise";

// Fonction pour nettoyer le mot de passe si nécessaire (enlève les quotes en trop)
const getSanitizedPassword = (pass: string | undefined) => {
  if (!pass) return pass;
  if ((pass.startsWith("'") && pass.endsWith("'")) || (pass.startsWith('"') && pass.endsWith('"'))) {
    return pass.slice(1, -1);
  }
  return pass;
};

const dbPassword = getSanitizedPassword(process.env.DB_PASS);

console.log("DB Config:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  passwordLength: dbPassword?.length,
  originalPasswordLength: process.env.DB_PASS?.length,
});

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: dbPassword,
  database: process.env.DB_NAME,
});
