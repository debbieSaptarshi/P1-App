import { Alert, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { api } from './api';
import { appStoreActions } from '@/hooks/useAppStore';
import { ensureFoodPlate } from './food-plate';
import type { AnalysisResult } from '@workspace/backend-contracts';
import type { FoodItem } from '@/types';
import type { FoodContext, MissingInput } from '@workspace/campus-food';
export type FoodAnalysis = AnalysisResult & {analysisId:string;provider:string;model:string};
export let scanDraft:{
  foods:FoodItem[];
  notes:string;
  photoUri?:string;
  assumptions:string[];
  missingInputs:MissingInput[];
  contextGuess?:FoodContext;
}|null=null;
export function setScanDraft(value:typeof scanDraft){scanDraft=value;}
export async function requestAiConsent(alreadyAccepted=false){
 if(alreadyAccepted)return;
 const message='Your photo, description, and relevant food preferences will be sent to the configured AI provider (OpenAI or Anthropic). Audio uses OpenAI. A small circular plate thumbnail may be generated from your meal photo or description (cached; cheapest image model). Results are estimates. Photos and audio are processed transiently by our backend; provider retention follows their policies.';
 const accepted=Platform.OS==='web'?window.confirm(message):await new Promise<boolean>(resolve=>Alert.alert('Use AI assistance?',message,[{text:'Cancel',style:'cancel',onPress:()=>resolve(false)},{text:'Continue',onPress:()=>resolve(true)}],{cancelable:true,onDismiss:()=>resolve(false)}));
 if(!accepted)throw new Error('AI request cancelled.');
 await appStoreActions.setAiConsent(true);
}
export async function fileBase64(uri:string){
 if(Platform.OS!=='web')return new File(uri).base64();
 const blob=await (await fetch(uri)).blob();
 return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
}
function defaultMealSlot(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 19) return 'snack';
  return 'dinner';
}

export async function analyzeFood(input:{kind:'food'|'label'|'text';uri?:string;base64?:string;mediaType?:string;text?:string;hostel?:string;outletId?:string;mealSlot?:'breakfast'|'lunch'|'dinner'|'snack'}){
 const image=input.uri||input.base64?{base64:input.base64??await fileBase64(input.uri!),mediaType:(input.mediaType??'image/jpeg') as 'image/jpeg'|'image/png'|'image/webp'}:undefined;
 const result=await api<FoodAnalysis>('/ai/analyze',{method:'POST',idempotencyKey:Crypto.randomUUID(),body:{
  kind:input.kind,text:input.text,consent:true,
  hostel:input.hostel,outletId:input.outletId,
  mealSlot:input.kind==='label'?undefined:(input.mealSlot??defaultMealSlot()),
  ...(image?{image}:{}),
 }});
 if(!result.foods.length)throw new Error(result.notes||'No food was identified. Try another photo or enter it manually.');
 const foods:FoodItem[]=result.foods.map(f=>({
  ...f,
  id:Crypto.randomUUID(),
  source: f.matchMethod === 'catalog' ? 'catalog' : 'ai',
  analysisId:result.analysisId,
  warnings:result.warnings,
 }));
 let plate:string|undefined;
 try{plate=await ensureFoodPlate(foods,input.kind==='food'?image:undefined);}catch{/* logging still works without a thumbnail */}
 setScanDraft({
  photoUri:input.uri,
  notes:result.notes,
  foods:foods.map(food=>({...food,image:plate})),
  assumptions: result.assumptions ?? [],
  missingInputs: result.missingInputs ?? [],
  contextGuess: result.contextGuess,
 });
 return result;
}
export async function lookupBarcode(code:string){
 const {food,attribution}=await api<{food:FoodItem;attribution:string}>(`/foods/barcode/${encodeURIComponent(code)}`);
 setScanDraft({foods:[food],notes:attribution,assumptions:[],missingInputs:[]});
}
