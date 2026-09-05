// Sender credentials stay in runtime secrets. Switching providers preserves membership.
export function mailConfigured(env) {
  if ((env.MAIL_PROVIDER || 'resend') === 'gmail') return !!(env.GMAIL_SENDER && env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN);
  return (env.MAIL_PROVIDER || 'resend') === 'resend' && !!(env.RESEND_API_KEY && env.MAIL_FROM);
}
function base64(text) {
  return btoa(Array.from(new TextEncoder().encode(text), b => String.fromCharCode(b)).join(''));
}
export async function sendMail(env, to, subject, text) {
  if (!mailConfigured(env)) throw new Error('Mail not configured');
  if ((env.MAIL_PROVIDER || 'resend') === 'resend') return fetch('https://api.resend.com/emails', {
    method: 'POST', headers: {Authorization: 'Bearer '+env.RESEND_API_KEY, 'Content-Type':'application/json'},
    body: JSON.stringify({from:env.MAIL_FROM,to:[to],subject,text}), signal:AbortSignal.timeout(15000)
  });
  // Reject header injection even when called outside the login handler.
  for (const address of [env.GMAIL_SENDER, to]) if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(address)) throw new Error('Invalid mail address');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({client_id:env.GMAIL_CLIENT_ID,client_secret:env.GMAIL_CLIENT_SECRET,refresh_token:env.GMAIL_REFRESH_TOKEN,grant_type:'refresh_token'}),
    signal:AbortSignal.timeout(15000)
  });
  if (!tokenResponse.ok) throw new Error('Gmail authorization unavailable');
  const token = await tokenResponse.json();
  if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('Gmail authorization unavailable');
  const mime = [`From: ${env.GMAIL_SENDER}`,`To: ${to}`,`Subject: =?UTF-8?B?${base64(subject)}?=`,
    'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',base64(text).match(/.{1,76}/g)?.join('\r\n') || ''].join('\r\n');
  const raw=base64(mime).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method:'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},
    body:JSON.stringify({raw}),signal:AbortSignal.timeout(15000)
  });
}
