import {mailConfigured} from './mail.mjs';
import {assets} from './assets.mjs';
import {body,json,fail,sameOrigin} from './util.mjs';
import {member,startLogin,verify,cookie,logout,listMembers,invite,changeMember,resendInvite,removeMember,joinStatus,startJoin,verifyJoin,joinAdmin,configureJoin,decideJoin} from './auth.mjs';
import {league,saveResult,recover,auditLog} from './results.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url);let response;
 try{
  if(url.pathname.startsWith('/api/')){
   if(!env.DB)fail(503,'Die Liga wird noch eingerichtet.');
   if(request.method==='POST')sameOrigin(request,env);
   if(request.method==='GET'&&url.pathname==='/api/status')response=json({configured:!!(env.APP_ORIGIN&&env.OWNER_EMAIL&&mailConfigured(env)&&env.SPREADSHEET_ID&&env.GOOGLE_SERVICE_ACCOUNT_EMAIL&&env.GOOGLE_PRIVATE_KEY)});
   else if(request.method==='GET'&&url.pathname==='/api/join-status')response=json(await joinStatus(env));
   else if(request.method==='POST'&&url.pathname==='/api/login')response=json(await startLogin(request,env,await body(request)));
   else if(request.method==='POST'&&url.pathname==='/api/join-start')response=json(await startJoin(request,env,await body(request)));
   else if(request.method==='POST'&&url.pathname==='/api/join-verify')response=json(await verifyJoin(env,await body(request)));
   else if(request.method==='POST'&&url.pathname==='/api/verify')response=json({ok:true},200,{'Set-Cookie':cookie(await verify(env,await body(request)))});
   else if(request.method==='POST'&&url.pathname==='/api/logout'){await logout(request,env);response=json({ok:true},200,{'Set-Cookie':cookie('',0)});}
   else {
    const actor=await member(request,env);
    if(request.method==='GET'&&url.pathname==='/api/league')response=json({...await league(env),me:actor});
    else if(request.method==='POST'&&url.pathname==='/api/results'){await member(request,env,['owner','manager']);response=json(await saveResult(request,env,actor,await body(request)));}
    else if(url.pathname==='/api/members'){await member(request,env,['owner']);if(request.method==='GET')response=json({members:await listMembers(env)});else if(request.method==='POST')response=json(await invite(env,actor,await body(request)));}
    else if(url.pathname==='/api/join-admin'){await member(request,env,['owner','manager']);if(request.method==='GET')response=json(await joinAdmin(env));else if(request.method==='POST')response=json(await configureJoin(env,actor,await body(request)));}
    else if(request.method==='POST'&&url.pathname==='/api/join-decision'){await member(request,env,['owner','manager']);response=json(await decideJoin(env,actor,await body(request)));}
    else if(request.method==='POST'&&url.pathname==='/api/member'){await member(request,env,['owner']);response=json(await changeMember(env,actor,await body(request)));}
    else if(request.method==='POST'&&url.pathname==='/api/resend-invite'){await member(request,env,['owner']);response=json(await resendInvite(env,actor,await body(request)));}
    else if(request.method==='POST'&&url.pathname==='/api/remove-member'){await member(request,env,['owner']);response=json(await removeMember(env,actor,await body(request)));}
    else if(request.method==='GET'&&url.pathname==='/api/audit'){await member(request,env,['owner','manager']);response=json({events:await auditLog(env)});}
    else if(request.method==='POST'&&url.pathname==='/api/recover'){await member(request,env,['owner']);response=json(await recover(env,actor));}
    if(!response)fail(404,'Nicht gefunden.');
   }
  }else if(request.method==='GET'){
   const key=['/','/join'].includes(url.pathname)?'/portal.html':['/entry','/demo'].includes(url.pathname)?'/index.html':url.pathname;const file=assets[key];if(!file)fail(404,'Nicht gefunden.');response=new Response(file.content,{headers:{'Content-Type':file.type,'Cache-Control':'no-store'}});
  }else fail(405,'Methode nicht erlaubt.');
 }catch(e){response=json({error:e.status?e.message:'Dienst vorübergehend nicht verfügbar. Bitte erneut versuchen.'},e.status||503);}
 const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('X-Frame-Options','DENY');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");return new Response(response.body,{status:response.status,headers});
}};
