import test from 'node:test';
import assert from 'node:assert/strict';
import {sendMail,mailConfigured} from '../server/mail.mjs';
const env={MAIL_PROVIDER:'gmail',GMAIL_SENDER:'owner@example.com',GMAIL_CLIENT_ID:'client',GMAIL_CLIENT_SECRET:'secret',GMAIL_REFRESH_TOKEN:'refresh'};
test('Gmail refreshes authorization and sends UTF-8 MIME without exposing secrets in mail',async t=>{
 const calls=[];t.mock.method(globalThis,'fetch',async (url,options)=>{calls.push({url,options});return calls.length===1?Response.json({access_token:'access'}):Response.json({id:'sent'});});
 assert.equal(mailConfigured(env),true);
 assert.equal((await sendMail(env,'member@example.org','Dein Zugang','Öffne deinen Link')).ok,true);
 assert.equal(calls[0].options.body.get('grant_type'),'refresh_token');
 assert.equal(calls[1].url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
 assert.equal(calls[1].options.headers.Authorization,'Bearer access');
 const mime=Buffer.from(JSON.parse(calls[1].options.body).raw,'base64url').toString();
 assert.match(mime,/To: member@example.org/);
 assert.equal(Buffer.from(mime.split('\r\n\r\n')[1],'base64').toString(),'Öffne deinen Link');
 assert.ok(!mime.includes('refresh'));assert.ok(!mime.includes('secret'));
});
test('Gmail authorization failure and invalid headers never send mail or fall back',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('',{status:400});});
 await assert.rejects(sendMail(env,'member@example.org','Access','Link'),/authorization/);assert.equal(calls,1);
 await assert.rejects(sendMail(env,'member@example.org\r\nBcc:other@example.org','Access','Link'),/Invalid/);assert.equal(calls,1);
 assert.equal(mailConfigured({...env,GMAIL_REFRESH_TOKEN:''}),false);
 assert.equal(mailConfigured({...env,MAIL_PROVIDER:'unknown'}),false);
});
