require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Aplicando esquema...');
  await pool.query(schema);
  console.log('Esquema aplicado correctamente.');

  const initialEmails = (process.env.INITIAL_AUTHORIZED_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  for (const email of initialEmails) {
    await pool.query(
      `INSERT INTO authorized_emails (email, is_admin) VALUES ($1, true)
       ON CONFLICT (email) DO NOTHING`,
      [email]
    );
    console.log(`Correo autorizado inicial: ${email}`);
  }

  await pool.end();
  console.log('Listo.');
}

migrate().catch((err) => {
  console.error('Error en migración:', err);
  process.exit(1);
});
