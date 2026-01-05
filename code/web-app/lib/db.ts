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
const connectionLimit = Number(process.env.DB_CONN_LIMIT || 5);

// Éviter de créer plusieurs pools en dev (HMR) pour ne pas dépasser max_user_connections
const globalWithPool = globalThis as typeof globalThis & { mysqlPool?: mysql.Pool };

if (!globalWithPool.mysqlPool) {
  globalWithPool.mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: dbPassword,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
  });
}

export const db = globalWithPool.mysqlPool;
