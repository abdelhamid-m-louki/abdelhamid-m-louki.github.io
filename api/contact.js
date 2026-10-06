import { appliquerCors, gererPreflight } from './_lib/cors.js';

/** Formulaire de contact → email via Resend */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  appliquerCors(req, res);
  if (gererPreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ erreur: 'Méthode non autorisée.' });
  }

  const corps = req.body || {};
  const nom = String(corps.nom || '').trim();
  const email = String(corps.email || '').trim();
  const sujet = String(corps.sujet || corps.objet || '').trim() || 'Message depuis amlouki.me';
  const message = String(corps.message || '').trim();

  // Honeypot : champ rempli = bot → faux succès silencieux
  if (corps.site_web) {
    return res.status(200).json({ ok: true });
  }

  if (!nom || nom.length > 200) {
    return res.status(400).json({ erreur: 'Nom invalide.' });
  }
  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    return res.status(400).json({ erreur: 'Email invalide.' });
  }
  if (sujet.length > 200) {
    return res.status(400).json({ erreur: 'Sujet invalide.' });
  }
  if (!message || message.length > 5000) {
    return res.status(400).json({ erreur: 'Message invalide (requis, max 5000 caractères).' });
  }

  const cle = process.env.RESEND_API_KEY;
  const destinataire = process.env.CONTACT_EMAIL;
  if (!cle || !destinataire) {
    return res.status(500).json({
      erreur: 'Service de contact non configuré (RESEND_API_KEY, CONTACT_EMAIL).',
    });
  }

  try {
    const reponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cle}`,
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'amlouki.me <onboarding@resend.dev>',
        to: [destinataire],
        reply_to: email,
        subject: `[amlouki.me] ${sujet} — ${nom}`,
        text: [`Nom : ${nom}`, `Email : ${email}`, `Sujet : ${sujet}`, '', message].join('\n'),
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!reponse.ok) {
      const detail = await reponse.json().catch(() => null);
      return res.status(502).json({
        erreur: detail?.message || `Erreur Resend ${reponse.status}.`,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ erreur: err?.message || 'Envoi impossible.' });
  }
}
