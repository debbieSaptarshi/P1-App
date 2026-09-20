import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import type {Server} from 'node:http';
import app from '../src/app';
process.env.SUPABASE_URL='http://supabase.test';process.env.SUPABASE_ANON_KEY='test-anon-key';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-key';
const originalFetch=globalThis.fetch;let server:Server;let base='';let lastRpc:any;
const user='11111111-1111-4111-8111-111111111111';
before(async()=>{
 globalThis.fetch=async(url,init)=>{
  const href=String(url);
  if(href.startsWith('http://supabase.test')){
   if(href.endsWith('/auth/v1/user')){
    const token=new Headers(init?.headers).get('authorization');
    return token==='Bearer valid-token'?Response.json({id:user,email:'test@example.com'}):Response.json({message:'Invalid token'},{status:401});
   }
   if(href.endsWith('/rpc/account_snapshot')){lastRpc=JSON.parse(init?.body as string);return Response.json({revision:0,records:[]});}
   throw new Error(`Unexpected Supabase request: ${href}`);
  }
  return originalFetch(url,init);
 };
 server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
 const address=server.address();assert.ok(address&&typeof address==='object');base=`http://127.0.0.1:${address.port}`;
});
after(async()=>{globalThis.fetch=originalFetch;if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));});
test('private routes reject missing and invalid sessions',async()=>{
 assert.equal((await fetch(`${base}/api/v1/state`)).status,401);
 assert.equal((await fetch(`${base}/api/v1/state`,{headers:{Authorization:'Bearer bad-token'}})).status,401);
});
test('verified user owns snapshot; query parameters cannot impersonate another account',async()=>{
 const response=await fetch(`${base}/api/v1/state?user_id=attacker`,{headers:{Authorization:'Bearer valid-token'}});assert.equal(response.status,200);assert.equal(lastRpc.p_user,user);assert.equal(response.headers.get('cache-control'),'no-store');
});
test('invalid writes and AI without consent fail before touching database/provider',async()=>{
 const headers={Authorization:'Bearer valid-token','Content-Type':'application/json'};
 assert.equal((await fetch(`${base}/api/v1/sync`,{method:'POST',headers,body:'{"changes":[]}'})).status,400);
 const ai=await fetch(`${base}/api/v1/ai/analyze`,{method:'POST',headers,body:'{"kind":"text","text":"toast","consent":false}'});assert.equal(ai.status,400);
 const deletion=await fetch(`${base}/api/v1/account`,{method:'DELETE',headers,body:'{"confirmation":"no"}'});assert.equal(deletion.status,400);
});
test('unknown endpoints and untrusted browser origins fail cleanly',async()=>{
 assert.equal((await fetch(`${base}/unknown`)).status,404);
 assert.equal((await fetch(`${base}/api/healthz`,{headers:{Origin:'https://untrusted.example'}})).status,403);
});
