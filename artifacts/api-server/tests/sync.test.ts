import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {CloudSync,applyChanges,type SyncDependencies} from '../../adaptive-food-coach/services/cloud-sync';
import type {CloudRecord,Snapshot} from '@workspace/backend-contracts';
const record=(waterMl:number):CloudRecord=>({collection:'hydration',id:'2026-09-20',data:{date:'2026-09-20',waterMl}});
function harness(){
 const disk=new Map<string,string>();let cloud:Snapshot={revision:0,records:[]};let offline=false,loseResponse=false;const applied=new Map<string,number>();
 const deps:SyncDependencies={uuid:randomUUID,storage:{getItem:async k=>disk.get(k)??null,setItem:async(k,v)=>{disk.set(k,v);},removeItem:async k=>{disk.delete(k);}},request:async<T>(path,options)=>{
  if(offline)throw new Error('offline');if(path==='/state')return structuredClone(cloud) as T;
  const body=options!.body as any;if(applied.has(body.mutationId))return {revision:applied.get(body.mutationId)} as T;
  if(body.expectedRevision!==cloud.revision)throw Object.assign(new Error('conflict'),{code:'REVISION_CONFLICT',status:409});
  cloud={revision:cloud.revision+1,records:applyChanges(cloud.records,body.changes)};applied.set(body.mutationId,cloud.revision);
  if(loseResponse){loseResponse=false;throw new Error('connection lost after commit');}
  return {revision:cloud.revision} as T;
 }};
 return {deps,disk,get cloud(){return cloud;},setOffline:(v:boolean)=>{offline=v;},loseNextResponse:()=>{loseResponse=true;},remoteEdit:()=>{cloud={revision:cloud.revision+1,records:[record(900)]};}};
}
async function settled(engine:CloudSync){for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,1));if(engine.status!=='syncing')return;}throw new Error('Sync did not settle');}
test('offline edits survive restart and sync once after reconnect',async()=>{
 const h=harness();let records:CloudRecord[]=[];const engine=new CloudSync('alice',r=>{records=r;},h.deps);await engine.initialize();h.setOffline(true);await engine.commit([record(500)]);await settled(engine);assert.equal(engine.status,'offline');engine.close();
 const restored=new CloudSync('alice',r=>{records=r;},h.deps);await restored.initialize();assert.equal(records[0].data.waterMl,500);h.setOffline(false);await restored.flush();assert.equal(h.cloud.records[0].data.waterMl,500);assert.equal(h.cloud.revision,1);assert.equal(restored.status,'synced');
});
test('lost success response replays the same mutation and does not duplicate data',async()=>{
 const h=harness(),engine=new CloudSync('alice',()=>{},h.deps);await engine.initialize();h.loseNextResponse();await engine.commit([record(500)]);await settled(engine);assert.equal(h.cloud.revision,1);await engine.flush();assert.equal(h.cloud.revision,1);assert.equal(engine.status,'synced');
});
test('conflict preserves edits until explicit user resolution',async()=>{
 const h=harness();let local:CloudRecord[]=[];const engine=new CloudSync('alice',r=>{local=r;},h.deps);await engine.initialize();h.remoteEdit();await engine.commit([record(500)]);await settled(engine);assert.equal(engine.status,'conflict');assert.equal(local[0].data.waterMl,500);assert.equal(h.cloud.records[0].data.waterMl,900);
 await engine.resolveConflict(false);assert.equal(local[0].data.waterMl,900);assert.equal(engine.status,'synced');
});
test('account caches are isolated and closed sessions cannot publish stale responses',async()=>{
 const h=harness();h.disk.set('@food-coach/cloud/v1/alice',JSON.stringify({base:{revision:0,records:[]},records:[record(500)],pending:null}));let bob:CloudRecord[]=[];const engine=new CloudSync('bob',r=>{bob=r;},h.deps);await engine.initialize();assert.deepEqual(bob,[]);engine.close();await assert.rejects(engine.commit([record(100)]),/no longer active/);
});
