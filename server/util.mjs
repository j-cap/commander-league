export class AppError extends Error {constructor(status,message){super(message);this.status=status;}}
export const fail=(status,message)=>{throw new AppError(status,message);};
export const now=()=>Math.floor(Date.now()/1000);
export const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
export const email=s=>{if(typeof s!=='string'||s.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()))fail(400,'Gültige E-Mail-Adresse eingeben.');return s.trim().toLowerCase();};
export const stmt=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
export const one=(env,sql,...args)=>stmt(env,sql,...args).first();
export const all=async(env,sql,...args)=>(await stmt(env,sql,...args).all()).results;
export const run=(env,sql,...args)=>stmt(env,sql,...args).run();
export async function body(request){const reader=request.body?.getReader();if(!reader)fail(400,'Eingabe fehlt.');let bytes=0,text='';const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>16384){await reader.cancel();fail(413,'Eingabe zu groß.');}text+=decoder.decode(value,{stream:true});}try{return JSON.parse(text+decoder.decode());}catch{fail(400,'Ungültige Eingabe.');}}
export const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
export function origin(env){if(!env.APP_ORIGIN)fail(503,'Die Liga wird noch eingerichtet.');const u=new URL(env.APP_ORIGIN);if(u.protocol!=='https:'||u.origin!==env.APP_ORIGIN)fail(503,'App-Adresse ist nicht korrekt konfiguriert.');return u.origin;}
export function sameOrigin(request,env){if(request.headers.get('Origin')!==origin(env)||!request.headers.get('Content-Type')?.startsWith('application/json'))fail(403,'Anfrage nicht erlaubt.');}
