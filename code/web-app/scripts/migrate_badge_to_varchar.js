const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

// Fonction pour nettoyer le mot de passe (copiée de db.ts)
const getSanitizedPassword = (pass) => {
  if (!pass) return pass;
  // Si le mot de passe est entouré de quotes (simples ou doubles), on les enlève
  if ((pass.startsWith("'") && pass.endsWith("'")) || (pass.startsWith('"') && pass.endsWith('"'))) {
    return pass.slice(1, -1);
  }
  // Si le mot de passe contient un backslash d'échappement devant un dollar (ex: \$), on l'enlève
  return pass.replace(/\\\$/g, '$');
};

async function migrate() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: getSanitizedPassword(process.env.DB_PASS),
    database: process.env.DB_NAME,
  };

  console.log('Connecting to DB with user:', config.user);
  const connection = await mysql.createConnection(config);

  try {
    console.log('Altering t_utilisateur to modify id_badge to VARCHAR(50)...');
    await connection.query("ALTER TABLE t_utilisateur MODIFY id_badge VARCHAR(50) NOT NULL UNIQUE");
    console.log('Success: t_utilisateur.id_badge is now VARCHAR(50).');
  } catch (err) {
    console.error('Error altering t_utilisateur:', err.message);
  }

  await connection.end();
}

migrate();
