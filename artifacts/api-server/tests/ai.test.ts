import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {analysisRequestSchema,analysisResultSchema,syncSchema} from '@workspace/backend-contracts';
import {OpenAIProvider,AnthropicProvider} from '../src/ai/providers';
import {validateImage} from '../src/routes/ai';
process.env.SUPABASE_URL='http://127.0.0.1:54321';process.env.SUPABASE_ANON_KEY='test-anon-key';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-key';
const originalFetch=globalThis.fetch;after(()=>{globalThis.fetch=originalFetch;});
const input={system:'test',text:'meal',schema:{type:'object'},image:{base64:'/9j/AA==',mediaType:'image/jpeg'}};
test('invalid nutrition, missing images, unsafe base64 and invalid dates fail validation',()=>{
 assert.equal(analysisRequestSchema.safeParse({kind:'food',consent:true}).success,false);
 assert.equal(analysisRequestSchema.safeParse({kind:'text',text:'toast',consent:false}).success,false);
 assert.equal(analysisResultSchema.safeParse({foods:[{name:'x',calories:-1}],warnings:[],notes:''}).success,false);
 assert.throws(()=>validateImage({base64:Buffer.from('<script/>').toString('base64'),mediaType:'image/jpeg'}));
 assert.equal(syncSchema.safeParse({mutationId:'11111111-1111-4111-8111-111111111111',expectedRevision:0,changes:[{collection:'hydration',id:'2026-02-30',data:{date:'2026-02-30',waterMl:20}}]}).success,false);
});
test('OpenAI sends image and strict schema, disables storage, and parses only output text',async()=>{
 globalThis.fetch=async(_url,init)=>{const body=JSON.parse(init!.body as string);assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(body.input[0].content[1].type,'input_image');return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{"foods":[]}'}]}],usage:{input_tokens:12,output_tokens:6}});};
 const result=await new OpenAIProvider('test','secret').generate(input);assert.deepEqual(result.value,{foods:[]});assert.equal(result.inputTokens,12);
});
test('OpenAI refusal and truncated responses never become food matches',async()=>{
 globalThis.fetch=async()=>Response.json({status:'completed',output:[{content:[{type:'refusal'}]}]});
 await assert.rejects(new OpenAIProvider('test','secret').generate(input),/could not help/);
 globalThis.fetch=async()=>Response.json({status:'incomplete',output:[]});await assert.rejects(new OpenAIProvider('test','secret').generate(input),/incomplete/);
});
test('Claude image/tool envelope maps into the same provider-neutral result',async()=>{
 globalThis.fetch=async(_url,init)=>{const body=JSON.parse(init!.body as string);assert.equal(body.tool_choice.name,'record_result');assert.equal(body.messages[0].content[0].source.type,'base64');return Response.json({stop_reason:'tool_use',content:[{type:'tool_use',name:'record_result',input:{foods:[]}}],usage:{input_tokens:20,output_tokens:8}});};
 const result=await new AnthropicProvider('test','secret').generate(input);assert.deepEqual(result.value,{foods:[]});assert.equal(result.outputTokens,8);
});
test('provider errors never expose response payloads or secrets',async()=>{
 globalThis.fetch=async()=>new Response('secret provider diagnostic',{status:429});
 await assert.rejects(new OpenAIProvider('test','secret').generate(input),e=>e instanceof Error&&!e.message.includes('secret')&&e.message.includes('unavailable'));
});
