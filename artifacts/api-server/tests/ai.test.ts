import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {analysisRequestSchema,analysisResultSchema,syncSchema} from '@workspace/backend-contracts';
import {OpenAIProvider,AnthropicProvider} from '../src/ai/providers';
import {validateImage} from '../src/routes/ai';
process.env.SUPABASE_URL='http://127.0.0.1:54321';process.env.SUPABASE_ANON_KEY='test-anon-key';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-key';process.env.OPENAI_API_KEY='sk-test';
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
test('OpenAI plate generation uses the cheapest image model and quality, never an input photo',async()=>{
 process.env.OPENAI_API_KEY='sk-test';
 globalThis.fetch=async(url,init)=>{
  assert.equal(String(url),'https://api.openai.com/v1/images/generations');
  const body=JSON.parse(init!.body as string);
  assert.equal(body.model,'gpt-image-1-mini');
  assert.equal(body.quality,'low');
  assert.equal(body.size,'1024x1024');
  assert.equal(body.n,1);
  assert.equal(body.output_format,'jpeg');
  assert.match(body.prompt,/saucer/);
  assert.match(body.prompt,/inside the saucer rim/);
  assert.equal(body.image,undefined);
  return Response.json({data:[{b64_json:'aGVsbG8='}]});
 };
 const {generateFoodPlate,foodPlateCacheKey,bucketCalories}=await import('../src/ai/food-plate');
 const foods=[{name:'Roasted Chicken',servingSize:'1 plate',calories:637,protein:65,carbs:45,fat:18}];
 const plate=await generateFoodPlate(foods);
 assert.equal(plate.imageBase64,'aGVsbG8=');
 assert.equal(plate.mediaType,'image/jpeg');
 assert.equal(bucketCalories(637),650);
 assert.equal(foodPlateCacheKey(foods,'gpt-image-1-mini'),foodPlateCacheKey([{...foods[0],name:'roasted chicken',calories:640}],'gpt-image-1-mini'));
});
test('meal photos are sent as a cheap edit reference and change the cache key',async()=>{
 const jpeg='aGVsbG8=';
 globalThis.fetch=async(url,init)=>{
  assert.equal(String(url),'https://api.openai.com/v1/images/edits');
  assert.equal(init!.headers && (init!.headers as Record<string,string>)['Content-Type'],undefined);
  assert.ok(init!.body instanceof FormData);
  const form=init!.body as FormData;
  assert.equal(form.get('model'),'gpt-image-1-mini');
  assert.equal(form.get('quality'),'low');
  assert.match(String(form.get('prompt')),/reference/);
  assert.match(String(form.get('prompt')),/same amount of food/);
  assert.ok(form.get('image'));
  return Response.json({data:[{b64_json:'cGxhdGU='}]});
 };
 const {generateFoodPlate,foodPlateCacheKey}=await import('../src/ai/food-plate');
 const foods=[{name:'Roasted Chicken',servingSize:'170 g',calories:280,protein:32,carbs:0,fat:12}];
 const reference={base64:jpeg,mediaType:'image/jpeg' as const};
 const plate=await generateFoodPlate(foods,reference);
 assert.equal(plate.imageBase64,'cGxhdGU=');
 assert.notEqual(foodPlateCacheKey(foods,'gpt-image-1-mini'),foodPlateCacheKey(foods,'gpt-image-1-mini',reference));
});
test('generated plates are cropped to the saucer rim',async()=>{
 const {PNG}=await import('pngjs');
 const {cropToSaucer}=await import('../src/ai/crop-saucer');
 const png=new PNG({width:64,height:64});
 for(let y=0;y<64;y+=1){
  for(let x=0;x<64;x+=1){
   const i=(y*64+x)*4;
   const dx=x-31.5, dy=y-31.5;
   const inside=dx*dx+dy*dy<=20*20;
   png.data[i]=inside?250:160;
   png.data[i+1]=inside?250:160;
   png.data[i+2]=inside?250:160;
   png.data[i+3]=255;
  }
 }
 const cropped=cropToSaucer(PNG.sync.write(png).toString('base64'),'image/png');
 const out=PNG.sync.read(Buffer.from(cropped.imageBase64,'base64'));
 assert.equal(out.width,out.height);
 assert.ok(out.width>=38 && out.width<=42);
 assert.equal(out.data[3],0);
 const midAlpha=out.data[(((out.height/2|0)*out.width+(out.width/2|0))*4)+3];
 assert.equal(midAlpha,255);
});
test('saucer crop still finds a pale plate on a light studio backdrop',async()=>{
 const {PNG}=await import('pngjs');
 const {cropToSaucer}=await import('../src/ai/crop-saucer');
 const png=new PNG({width:64,height:64});
 for(let y=0;y<64;y+=1){
  for(let x=0;x<64;x+=1){
   const i=(y*64+x)*4;
   const dx=x-31.5, dy=y-31.5;
   const r=Math.sqrt(dx*dx+dy*dy);
   const inside=r<=20;
   const food=r<=12;
   png.data[i]=food?80:inside?248:220;
   png.data[i+1]=food?40:inside?248:220;
   png.data[i+2]=food?20:inside?248:220;
   png.data[i+3]=255;
  }
 }
 const cropped=cropToSaucer(PNG.sync.write(png).toString('base64'),'image/png');
 const out=PNG.sync.read(Buffer.from(cropped.imageBase64,'base64'));
 assert.equal(out.width,out.height);
 assert.ok(out.width>=38 && out.width<=42);
});
test('white ceramic still counts as the saucer when the backdrop is almost as light',async()=>{
 const {PNG}=await import('pngjs');
 const {cropToSaucer}=await import('../src/ai/crop-saucer');
 const png=new PNG({width:64,height:64});
 for(let y=0;y<64;y+=1){
  for(let x=0;x<64;x+=1){
   const i=(y*64+x)*4;
   const dx=x-31.5, dy=y-31.5;
   const r=Math.sqrt(dx*dx+dy*dy);
   const inside=r<=22;
   const food=r<=12;
   png.data[i]=food?70:inside?230:216;
   png.data[i+1]=food?45:inside?230:216;
   png.data[i+2]=food?30:inside?228:216;
   png.data[i+3]=255;
  }
 }
 const cropped=cropToSaucer(PNG.sync.write(png).toString('base64'),'image/png');
 const out=PNG.sync.read(Buffer.from(cropped.imageBase64,'base64'));
 assert.ok(out.width>=40 && out.width<=46);
});
