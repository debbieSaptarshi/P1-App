import { Alert, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { api } from './api';
import { appStoreActions } from '@/hooks/useAppStore';
import type { AnalysisResult } from '@workspace/backend-contracts';
import type { FoodItem } from '@/types';
export type FoodAnalysis = AnalysisResult & {analysisId:string;provider:string;model:string};
export let scanDraft:{foods:FoodItem[];notes:string;photoUri?:string}|null=null;
export function setScanDraft(value:typeof scanDraft){scanDraft=value;}
export async function requestAiConsent(alreadyAccepted=false){
 if(alreadyAccepted)return;
 const message='Your photo, description, and relevant food preferences will be sent to the configured AI provider (OpenAI or Anthropic). Audio uses OpenAI. Results are estimates. Photos and audio are processed transiently by our backend; provider retention follows their policies.';
 const accepted=Platform.OS==='web'?window.confirm(message):await new Promise<boolean>(resolve=>Alert.alert('Use AI assistance?',message,[{text:'Cancel',style:'cancel',onPress:()=>resolve(false)},{text:'Continue',onPress:()=>resolve(true)}],{cancelable:true,onDismiss:()=>resolve(false)}));
 if(!accepted)throw new Error('AI request cancelled.');
 await appStoreActions.setAiConsent(true);
}
export async function fileBase64(uri:string){
 if(Platform.OS!=='web')return new File(uri).base64();
 const blob=await (await fetch(uri)).blob();
 return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
}
export async function analyzeFood(input:{kind:'food'|'label'|'text';uri?:string;base64?:string;mediaType?:string;text?:string}){
 const result=await api<FoodAnalysis>('/ai/analyze',{method:'POST',idempotencyKey:Crypto.randomUUID(),body:{kind:input.kind,text:input.text,consent:true,...(input.uri||input.base64?{image:{base64:input.base64??await fileBase64(input.uri!),mediaType:input.mediaType??'image/jpeg'}}:{})}});
 if(!result.foods.length)throw new Error(result.notes||'No food was identified. Try another photo or enter it manually.');
 setScanDraft({photoUri:input.uri,notes:result.notes,foods:result.foods.map(f=>({...f,id:Crypto.randomUUID(),source:'ai',analysisId:result.analysisId,warnings:result.warnings}))});
 return result;
}
export async function lookupBarcode(code:string){
 const {food,attribution}=await api<{food:FoodItem;attribution:string}>(`/foods/barcode/${encodeURIComponent(code)}`);
 setScanDraft({foods:[food],notes:attribution});
}
