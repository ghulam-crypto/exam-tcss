// Vercel serverless proxy: hides the Google Apps Script URL from the browser.
// Set the environment variable APPS_SCRIPT_URL in Vercel to your Web app URL (.../exec).

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const target = process.env.APPS_SCRIPT_URL;
  if (!target) return res.status(500).json({ ok: false, error: 'Server is not configured.' });

  try {
    let upstream;

    if (req.method === 'GET') {
      upstream = await fetch(target, { redirect: 'follow' });

    } else if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      if (body.length > 50000) return res.status(413).json({ ok: false, error: 'Request too large.' });

      let data;
      try { data = JSON.parse(body); } catch (e) { return res.status(400).json({ ok: false, error: 'Bad request.' }); }
      if (data.action !== 'start' && data.action !== 'submit') {
        return res.status(400).json({ ok: false, error: 'Unknown action.' });
      }

      upstream = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow'
      });

    } else {
      return res.status(405).json({ ok: false, error: 'Method not allowed.' });
    }

    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(text);

  } catch (err) {
    return res.status(502).json({ ok: false, error: 'Could not reach the exam server. Please try again.' });
  }
}
