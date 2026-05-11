// Cloudflare Pages Function — proxies email signup to Airtable
// POST /api/signup { email: "..." }
// Set AIRTABLE_TOKEN as Cloudflare Pages environment variable
export async function onRequestPost(context) {
  try {
    const { email } = await context.request.json();
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const AIRTABLE_TOKEN = context.env.AIRTABLE_TOKEN;
    if (!AIRTABLE_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server config error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const BASE_ID = 'appZ6obLwlMXAjalJ';
    const TABLE = 'Pre-registrations';

    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          Email: email,
          Source: 'geta.bot',
          Date: new Date().toISOString()
        }
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      if (data.error?.type === 'INVALID_RECORD_FOR_DUPLICATE_NAMES') {
        return new Response(JSON.stringify({ ok: true, duplicate: true }), { headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: data.error?.message || 'Airtable error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
