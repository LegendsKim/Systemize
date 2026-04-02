// Vercel Serverless Function – Send lead to Telegram
// Environment variables required:
//   TELEGRAM_BOT_TOKEN  – Bot token from @BotFather
//   TELEGRAM_CHAT_ID    – Target chat / group ID

export default async function handler(req, res) {
  // ── CORS (allow same-origin & Vercel preview URLs) ──────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Only POST ───────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // ── Validate env vars ──────────────────────────────────────
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('[send-telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return res.status(500).json({ ok: false, error: 'Server configuration error' });
  }

  // ── Parse body ─────────────────────────────────────────────
  const { name, email, phone, pain_point, source, origin, timestamp } = req.body || {};

  if (!name || !email || !phone) {
    return res.status(400).json({ ok: false, error: 'Missing required fields (name, email, phone)' });
  }

  // ── Build Telegram message ─────────────────────────────────
  const message = [
    '🟢  *ליד חדש מ-Systemize!*',
    '',
    `👤  *שם:*  ${escapeMarkdown(name)}`,
    `📧  *מייל:*  ${escapeMarkdown(email)}`,
    `📱  *טלפון:*  ${escapeMarkdown(phone)}`,
    `🔥  *נקודת כאב:*  ${escapeMarkdown(pain_point || '—')}`,
    `📍  *מקור:*  ${escapeMarkdown(source || '—')}`,
    '',
    `🌐  *מקור דף:*  ${escapeMarkdown(origin || 'N/A')}`,
    `🕐  *זמן:*  ${escapeMarkdown(timestamp || new Date().toISOString())}`,
    '',
    '─────────────────────────',
    '⚡ _נשלח אוטומטית ע״י Systemize Macro_',
  ].join('\n');

  // ── Send to Telegram ───────────────────────────────────────
  const telegramURL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const tgRes = await fetch(telegramURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error('[send-telegram] Telegram API error:', tgData);
      return res.status(502).json({ ok: false, error: 'שגיאת תקשורת במאקרו' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[send-telegram] Fetch error:', err);
    return res.status(502).json({ ok: false, error: 'שגיאת תקשורת במאקרו' });
  }
}

// ── Helpers ──────────────────────────────────────────────────
function escapeMarkdown(text) {
  if (!text) return '';
  // In Telegram's legacy 'Markdown' mode, only _, *, `, and [ need escaping.
  // Escaping other characters like dots (.) or hyphens (-) will cause the backslash to be visible.
  return String(text).replace(/([_*`\[])/g, '\\$1');
}
