import { Router } from 'express';
import { z } from 'zod';
import { admin, dbError } from '../lib/supabase';
import { HttpError } from '../lib/errors';
export const communityRouter = Router();
const id = z.string().min(1).max(120).regex(/^[\w-]+$/);
const uuid = z.string().uuid();
const bodySchema = z.object({ id:uuid, body:z.string().trim().min(1).max(3000) });
async function author(userId: string) {
 const {data,error} = await admin().from('app_records').select('data').eq('user_id',userId).eq('collection','profile').eq('id','self').maybeSingle(); dbError(error);
 return String(data?.data.name || 'Member').slice(0,100);
}
async function requireMembership(userId: string, groupId: string) {
 const {data,error} = await admin().from('group_members').select('user_id').eq('user_id',userId).eq('group_id',groupId).maybeSingle(); dbError(error);
 if (!data) throw new HttpError(403,'JOIN_REQUIRED','Join the group before posting.');
}
async function accessiblePost(userId: string, postId: string) {
 const {data,error} = await admin().from('community_posts').select('*').eq('id',postId).maybeSingle(); dbError(error);
 if (!data) throw new HttpError(404,'NOT_FOUND','Post not found.');
 const blocks = await admin().from('user_blocks').select('user_id').or(`and(user_id.eq.${userId},blocked_id.eq.${data.user_id}),and(user_id.eq.${data.user_id},blocked_id.eq.${userId})`); dbError(blocks.error);
 if (blocks.data?.length) throw new HttpError(404,'NOT_FOUND','Post not found.');
 return data;
}
communityRouter.get('/',async(req,res)=>{const result=await admin().rpc('community_snapshot',{p_user:req.user.id});dbError(result.error);res.json(result.data);});
communityRouter.put('/groups/:id/membership',async(req,res)=>{
 const groupId=id.parse(req.params.id),{joined}=z.object({joined:z.boolean()}).parse(req.body);
 const result=joined?await admin().from('group_members').upsert({group_id:groupId,user_id:req.user.id},{onConflict:'group_id,user_id'}):await admin().from('group_members').delete().eq('group_id',groupId).eq('user_id',req.user.id);
 dbError(result.error);res.status(204).end();
});
communityRouter.post('/groups/:id/posts',async(req,res)=>{
 const groupId=id.parse(req.params.id),input=bodySchema.parse(req.body);await requireMembership(req.user.id,groupId);
 const result=await admin().from('community_posts').insert({id:input.id,group_id:groupId,user_id:req.user.id,author_name:await author(req.user.id),body:input.body});
 if(result.error?.code !== '23505') dbError(result.error);res.status(201).json({id:input.id});
});
communityRouter.delete('/posts/:id',async(req,res)=>{const result=await admin().from('community_posts').delete().eq('id',uuid.parse(req.params.id)).eq('user_id',req.user.id);dbError(result.error);res.status(204).end();});
communityRouter.put('/posts/:id/like',async(req,res)=>{
 const postId=uuid.parse(req.params.id),{liked}=z.object({liked:z.boolean()}).parse(req.body);await accessiblePost(req.user.id,postId);
 const result=liked?await admin().from('post_likes').upsert({post_id:postId,user_id:req.user.id},{onConflict:'post_id,user_id'}):await admin().from('post_likes').delete().eq('post_id',postId).eq('user_id',req.user.id);dbError(result.error);res.status(204).end();
});
communityRouter.get('/posts/:id/comments',async(req,res)=>{
 const postId=uuid.parse(req.params.id);await accessiblePost(req.user.id,postId);
 const offset=z.coerce.number().int().min(0).default(0).parse(req.query.offset);
 const blocks=await admin().from('user_blocks').select('user_id,blocked_id').or(`user_id.eq.${req.user.id},blocked_id.eq.${req.user.id}`);dbError(blocks.error);
 const blocked=(blocks.data??[]).map(b=>b.user_id===req.user.id?b.blocked_id:b.user_id);
 let query=admin().from('post_comments').select('id,author_name,body,created_at,user_id').eq('post_id',postId);
 if(blocked.length) query=query.not('user_id','in',`(${blocked.join(',')})`);
 const result=await query.order('created_at').range(offset,offset+49);dbError(result.error);
 res.json({comments:result.data?.map(c=>({id:c.id,author:c.author_name,body:c.body,createdAt:c.created_at,authorId:c.user_id})),nextOffset:result.data?.length===50?offset+50:null});
});
communityRouter.post('/posts/:id/comments',async(req,res)=>{
 const postId=uuid.parse(req.params.id),input=bodySchema.parse(req.body),post=await accessiblePost(req.user.id,postId);await requireMembership(req.user.id,post.group_id);
 const result=await admin().from('post_comments').insert({id:input.id,post_id:postId,user_id:req.user.id,author_name:await author(req.user.id),body:input.body});if(result.error?.code!=='23505')dbError(result.error);res.status(201).json({id:input.id});
});
communityRouter.delete('/comments/:id',async(req,res)=>{const result=await admin().from('post_comments').delete().eq('id',uuid.parse(req.params.id)).eq('user_id',req.user.id);dbError(result.error);res.status(204).end();});
communityRouter.put('/challenges/:id/membership',async(req,res)=>{
 const challengeId=id.parse(req.params.id),{joined}=z.object({joined:z.boolean()}).parse(req.body);
 const challenge=await admin().from('challenges').select('ends_at').eq('id',challengeId).maybeSingle();dbError(challenge.error);
 if(!challenge.data||new Date(challenge.data.ends_at)<new Date())throw new HttpError(404,'NOT_FOUND','Challenge has ended.');
 const result=joined?await admin().from('challenge_members').upsert({challenge_id:challengeId,user_id:req.user.id},{onConflict:'challenge_id,user_id'}):await admin().from('challenge_members').delete().eq('challenge_id',challengeId).eq('user_id',req.user.id);dbError(result.error);res.status(204).end();
});
communityRouter.post('/posts/:id/report',async(req,res)=>{
 const postId=uuid.parse(req.params.id),{reason}=z.object({reason:z.string().trim().min(1).max(1000)}).parse(req.body);await accessiblePost(req.user.id,postId);
 const result=await admin().from('content_reports').insert({user_id:req.user.id,post_id:postId,reason});dbError(result.error);res.status(201).json({reported:true});
});
communityRouter.put('/users/:id/block',async(req,res)=>{
 const blockedId=uuid.parse(req.params.id),{blocked}=z.object({blocked:z.boolean()}).parse(req.body);
 if(blockedId===req.user.id)throw new HttpError(400,'INVALID_INPUT','You cannot block yourself.');
 const result=blocked?await admin().from('user_blocks').upsert({user_id:req.user.id,blocked_id:blockedId}):await admin().from('user_blocks').delete().eq('user_id',req.user.id).eq('blocked_id',blockedId);dbError(result.error);res.status(204).end();
});
