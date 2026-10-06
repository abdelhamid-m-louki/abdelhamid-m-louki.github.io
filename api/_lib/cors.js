/** CORS — autorise GitHub Pages (amlouki.me) à appeler l'API Vercel */

const ORIGINES_DEFAUT = [
  'https://amlouki.me',
  'https://www.amlouki.me',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const ORIGINES = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const AUTORISEES = ORIGINES.length ? ORIGINES : ORIGINES_DEFAUT;

export function appliquerCors(req, res) {
  const origine = req.headers.origin;
  if (origine && AUTORISEES.includes(origine)) {
    res.setHeader('Access-Control-Allow-Origin', origine);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/** Gère le preflight OPTIONS — renvoie true si la requête est terminée */
export function gererPreflight(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
