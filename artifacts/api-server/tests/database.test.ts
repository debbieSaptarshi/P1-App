import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
const mutation='33333333-3333-4333-8333-333333333333';
before(async()=>{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to anon,authenticated,service_role;
 insert into auth.users values('${alice}'),('${bob}');`);
 await db.exec(await readFile(new URL('../../../supabase/migrations/202609200001_backend.sql',import.meta.url),'utf8'));
});
after(()=>db.close());
test('migration grants no anonymous access and denies client writes',async()=>{
 await db.exec('set role anon');
 await assert.rejects(db.query('select * from public.app_records'),/permission denied/);
 await assert.rejects(db.query('select public.account_snapshot($1)',[alice]),/permission denied/);
 await db.exec('reset role;set role authenticated');
 await assert.rejects(db.query("insert into public.app_records values($1,'profile','self',1,'{}',now())",[alice]),/permission denied/);
 await assert.rejects(db.query('select public.apply_record_changes($1,$2,0,$3)',[alice,mutation,'[]']),/permission denied/);
 await db.exec('reset role');
});
test('atomic sync is idempotent and stale updates cannot overwrite newer data',async()=>{
 const changes=JSON.stringify([{collection:'hydration',id:'2026-09-20',data:{date:'2026-09-20',waterMl:500}},{collection:'weights',id:'weight1',data:{id:'weight1',date:'2026-09-20',weightKg:70}}]);
 const first=await db.query<{revision:number}>('select public.apply_record_changes($1,$2,0,$3) revision',[alice,mutation,changes]);
 assert.equal(first.rows[0].revision,1);
 const retry=await db.query<{revision:number}>('select public.apply_record_changes($1,$2,0,$3) revision',[alice,mutation,changes]);assert.equal(retry.rows[0].revision,1);
 await assert.rejects(db.query('select public.apply_record_changes($1,$2,0,$3)',[alice,'44444444-4444-4444-8444-444444444444',changes]),/REVISION_CONFLICT/);
 const snapshot=await db.query<{data:any}>('select public.account_snapshot($1) data',[alice]);assert.equal(snapshot.rows[0].data.records.length,2);assert.equal(snapshot.rows[0].data.revision,1);
 // A bad record aborts the entire transaction, including an earlier good change.
 await assert.rejects(db.query('select public.apply_record_changes($1,$2,1,$3)',[alice,'55555555-5555-4555-8555-555555555555',JSON.stringify([{collection:'hydration',id:'2026-09-20',data:{waterMl:999}},{collection:'unknown',id:'bad',data:{}}])]),/check constraint/);
 const saved=await db.query<{data:any}>("select data from public.app_records where user_id=$1 and collection='hydration'",[alice]);assert.equal(saved.rows[0].data.waterMl,500);
});
test('RLS isolates accounts even with valid JWT identity and exposes no community data directly',async()=>{
 await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${bob}',false)`);
 assert.equal((await db.query('select * from public.app_records')).rows.length,0);
 await assert.rejects(db.query('select * from public.ai_requests where user_id=$1',[alice]).then(r=>{assert.equal(r.rows.length,0);return Promise.reject(new Error('verified'));}),/verified/);
 await assert.rejects(db.query('select * from public.community_posts'),/permission denied/);
 await db.exec(`select set_config('request.jwt.claim.sub','${alice}',false)`);
 assert.equal((await db.query('select * from public.app_records')).rows.length,2);
 await db.exec('reset role');
});
test('AI reservations enforce quota and replay a request without allocating another',async()=>{
 const call=async(id:string,key:string)=>db.query<{id:string}>('select (public.reserve_ai_request($1,$2,$3,$4,$5,$6,$7,$8)).id',[alice,id,key,'food','openai','test-model','v1',1]);
 const first=await call('66666666-6666-4666-8666-666666666666',mutation);assert.equal(first.rows[0].id,'66666666-6666-4666-8666-666666666666');
 const again=await call('77777777-7777-4777-8777-777777777777',mutation);assert.equal(again.rows[0].id,first.rows[0].id);
 await assert.rejects(call('88888888-8888-4888-8888-888888888888','99999999-9999-4999-8999-999999999999'),/AI_QUOTA_EXCEEDED/);
});
test('community counts use distinct memberships; deletion cascades and removes private data',async()=>{
 await db.query("insert into public.group_members values('everyday-nutrition',$1,now()) on conflict do nothing",[alice]);
 await db.query("insert into public.group_members values('everyday-nutrition',$1,now()) on conflict do nothing",[alice]);
 const result=await db.query<{data:any}>('select public.community_snapshot($1) data',[bob]);
 assert.equal(result.rows[0].data.groups.find((g:any)=>g.id==='everyday-nutrition').members,1);
 assert.equal(result.rows[0].data.groups.find((g:any)=>g.id==='everyday-nutrition').joined,false);
 await db.query('delete from auth.users where id=$1',[alice]);
 for(const table of ['app_records','ai_requests','sync_mutations','account_revisions','group_members'])assert.equal((await db.query(`select * from public.${table}`)).rows.length,0);
});
