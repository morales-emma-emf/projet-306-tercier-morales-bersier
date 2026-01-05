const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.error('Veuillez fournir un mot de passe en argument.');
    console.log('Usage: node scripts/generate-password.js <votre_mot_de_passe>');
    process.exit(1);
}


bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Erreur lors du hachage :', err);
        return;
    }
    console.log('\nMot de passe haché (à mettre en BDD) :');
    console.log('\x1b[32m%s\x1b[0m', hash); // Affiche en vert
});
