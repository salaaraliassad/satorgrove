// /api/request-demo.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      first_name, last_name, email, company,
      company_type, company_size, source, notes
    } = req.body || {};

    // honeypot
    if (req.body.website) return res.status(200).json({ ok: true });

    if (!first_name || !last_name || !email || !company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1) Get app-only token
    const tokenResp = await fetch(
      `https://login.microsoftonline.com/${process.env.M365_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.M365_CLIENT_ID,
          client_secret: process.env.M365_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        })
      }
    );
    if (!tokenResp.ok) throw new Error(`Token error: ${await tokenResp.text()}`);
    const { access_token } = await tokenResp.json();

    // 2) Send via Graph
    const subject = `Demo request — ${company} (${first_name} ${last_name})`;
    const html = `
      <h2 style="margin:0 0 12px">New Demo Request</h2>
      <table cellspacing="0" cellpadding="4" style="font-family:Arial,sans-serif;font-size:14px">
        <tr><td><b>Name</b></td><td>${first_name} ${last_name}</td></tr>
        <tr><td><b>Email</b></td><td>${email}</td></tr>
        <tr><td><b>Company</b></td><td>${company}</td></tr>
        <tr><td><b>Company Type</b></td><td>${company_type || '-'}</td></tr>
        <tr><td><b>Company Size</b></td><td>${company_size || '-'}</td></tr>
        <tr><td><b>How heard</b></td><td>${source || '-'}</td></tr>
        <tr><td><b>Notes</b></td><td>${(notes || '').replace(/\n/g,'<br/>')}</td></tr>
      </table>
      <p style="margin-top:12px">Reply to this email to contact the requester.</p>
    `;

    const sendResp = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(process.env.M365_FROM)}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'HTML', content: html },
            toRecipients: [{ emailAddress: { address: process.env.M365_TO } }],
            replyTo: [{ emailAddress: { address: email } }]
          },
          saveToSentItems: true
        })
      }
    );
    if (!sendResp.ok) throw new Error(`Graph sendMail: ${await sendResp.text()}`);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
