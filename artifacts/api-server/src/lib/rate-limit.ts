import type { RequestHandler } from 'express';
import { HttpError } from './errors';
// Per-instance abuse guard; AI spending quota is additionally enforced in SQL
// across all replicas. Deploy behind a gateway rate limit for fleet-wide traffic.
export function rateLimit(limit: number, identity: 'ip' | 'user'): RequestHandler {
 const buckets=new Map<string,{count:number;reset:number}>();
 return(req,res,next)=>{
  const now=Date.now(),key=identity==='user'?req.user.id:(req.ip??'unknown');
  if(buckets.size>10000) for(const [k,v] of buckets)if(v.reset<=now)buckets.delete(k);
  let bucket=buckets.get(key);
  if(!bucket||bucket.reset<=now){
   if(buckets.size>20000)throw new HttpError(503,'BUSY','Please try again shortly.');
   bucket={count:0,reset:now+60000};buckets.set(key,bucket);
  }
  if(++bucket.count>limit){res.setHeader('Retry-After',Math.ceil((bucket.reset-now)/1000));throw new HttpError(429,'RATE_LIMITED','Too many requests. Please wait a moment.');}
  next();
 };
}
