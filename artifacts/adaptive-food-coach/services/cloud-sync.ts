import type { CloudRecord, RecordChange, Snapshot } from '@workspace/backend-contracts';
export interface SyncDependencies {
 storage: {getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<void>;removeItem(key:string):Promise<void>};
 request<T>(path:string,options?:{method?:string;body?:unknown}):Promise<T>;
 uuid():string;
}
function errorMessage(error:unknown){return error instanceof Error?error.message:'Sync failed.';}
export type SyncStatus = 'loading'|'synced'|'syncing'|'offline'|'conflict'|'error';
const keyOf=(r:{collection:string;id:string})=>`${r.collection}/${r.id}`;
export function diffRecords(base:CloudRecord[],next:CloudRecord[]):RecordChange[]{
 const previous=new Map(base.map(r=>[keyOf(r),r]));const changes:RecordChange[]=[];
 for(const record of next){const before=previous.get(keyOf(record));if(!before||JSON.stringify(before.data)!==JSON.stringify(record.data))changes.push(record);previous.delete(keyOf(record));}
 for(const record of previous.values())changes.push({...record,data:null});
 return changes;
}
export function applyChanges(base:CloudRecord[],changes:RecordChange[]):CloudRecord[]{
 const records=new Map(base.map(r=>[keyOf(r),r]));
 for(const change of changes){if(change.data===null)records.delete(keyOf(change));else records.set(keyOf(change),change as CloudRecord);}
 return [...records.values()];
}
type Pending={mutationId:string;expectedRevision:number;changes:RecordChange[]};
type Cache={base:Snapshot;records:CloudRecord[];pending:Pending|null};
export class CloudSync {
 private cache:Cache={base:{revision:0,records:[]},records:[],pending:null};
 private writing=Promise.resolve();private flushing=false;private closed=false;
 private storageKey:string; status:SyncStatus='loading';message='';
 constructor(readonly userId:string,private changed:(records:CloudRecord[],status:SyncStatus,message:string)=>void,private deps:SyncDependencies){this.storageKey=`@food-coach/cloud/v1/${userId}`;}
 close(){this.closed=true;}
 private emit(status:SyncStatus,message=''){if(this.closed)return;this.status=status;this.message=message;this.changed(this.cache.records,status,message);}
 private save(){const value=JSON.stringify(this.cache);this.writing=this.writing.catch(()=>{}).then(()=>this.deps.storage.setItem(this.storageKey,value));return this.writing;}
 async initialize(){
  const raw=await this.deps.storage.getItem(this.storageKey);if(this.closed)return;
  if(raw){this.cache=JSON.parse(raw);this.emit('syncing');await this.flush();}
  else{try{this.cache.base=await this.deps.request<Snapshot>('/state');if(this.closed)return;this.cache.records=this.cache.base.records;await this.save();this.emit('synced');}catch(e){this.emit('offline',errorMessage(e));}}
 }
 async commit(records:CloudRecord[]){
  if(this.closed)throw new Error('This account is no longer active.');
  this.cache.records=records;
  try{await this.save();}catch(e){this.emit('error','Changes could not be saved on this device. Free storage and retry.');throw e;}
  if(this.status!=='conflict'){this.emit('syncing');void this.flush();}
 }
 async flush(){
  if(this.closed||this.flushing||this.status==='conflict')return;
  this.flushing=true;
  try{
   // Loop also preserves edits made while a request was in flight.
   while(!this.closed){
    const changes=diffRecords(this.cache.base.records,this.cache.records);
    if(!this.cache.pending&&!changes.length){
     const snapshot=await this.deps.request<Snapshot>('/state');if(this.closed)return;
     if(diffRecords(this.cache.base.records,this.cache.records).length)continue;
     this.cache.base=snapshot;this.cache.records=snapshot.records;await this.save();this.emit('synced');break;
    }
    if(!this.cache.pending){this.cache.pending={mutationId:this.deps.uuid(),expectedRevision:this.cache.base.revision,changes:changes.slice(0,500)};await this.save();}
    const pending=this.cache.pending;
    const result=await this.deps.request<{revision:number}>('/sync',{method:'POST',body:pending});if(this.closed)return;
    this.cache.base={revision:result.revision,records:applyChanges(this.cache.base.records,pending.changes)};
    this.cache.pending=null;await this.save();
   }
  }catch(e){this.emit((e as {code?:string})?.code==='REVISION_CONFLICT'?'conflict':typeof (e as {status?:number})?.status==='number'&&(e as {status:number}).status<500?'error':'offline',errorMessage(e));}
  finally{this.flushing=false;}
 }
 async resolveConflict(keepLocal:boolean){
  if(this.flushing)return;
  const changes=diffRecords(this.cache.base.records,this.cache.records),snapshot=await this.deps.request<Snapshot>('/state');if(this.closed)return;
  // Capture the user's explicit choice: apply local changed records onto latest,
  // or discard local pending changes and use the cloud snapshot.
  this.cache={base:snapshot,records:keepLocal?applyChanges(snapshot.records,changes):snapshot.records,pending:null};
  await this.save();this.emit('syncing');await this.flush();
 }
 async clearCache(){await this.writing.catch(()=>{});await this.deps.storage.removeItem(this.storageKey);}
}
