import React,{useState} from 'react';
import {Alert,ScrollView,Text,View,Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import * as Crypto from 'expo-crypto';
import {Button,Header,TextField} from '@/components/ui';
import {VoiceInput} from '@/components/VoiceInput';
import {api,errorMessage} from '@/services/api';
import {analyzeFood,requestAiConsent} from '@/services/ai';
import {useAppStore} from '@/hooks/useAppStore';
import type {MealRecipe} from '@/types';
type Meal={name:string;mealType:string;ingredients:string[];instructions:string;calories:number;protein:number;carbs:number;fat:number;fiber:number};
export default function Coach(){
 const router=useRouter();const {state,actions}=useAppStore();const [mode,setMode]=useState<'coach'|'plan'|'text'>('coach'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[history,setHistory]=useState<{role:'user'|'assistant';content:string}[]>([]),[meals,setMeals]=useState<Meal[]>([]),[notes,setNotes]=useState('');
 const submit=async()=>{if(busy||!message.trim())return;setBusy(true);try{
  await requestAiConsent(state.preferences.aiConsent);
  if(mode==='text'){await analyzeFood({kind:'text',text:message});router.push('/scan/review');return;}
  if(mode==='coach'){const result=await api<{reply:string;suggestions:string[]}>('/ai/coach',{method:'POST',idempotencyKey:Crypto.randomUUID(),body:{message,history:history.slice(-12),consent:true}});setHistory(h=>[...h,{role:'user',content:message},{role:'assistant',content:[result.reply,...result.suggestions].join('\n\n')}]);}
  else{const result=await api<{meals:Meal[];notes:string}>('/ai/plan',{method:'POST',idempotencyKey:Crypto.randomUUID(),body:{message,consent:true}});setMeals(result.meals);setNotes(result.notes);}
  setMessage('');
 }catch(e){Alert.alert('AI assistant',errorMessage(e));}finally{setBusy(false);}};
 return <SafeAreaView style={{flex:1,backgroundColor:'#fff'}}><Header title="Food & fitness coach"/><ScrollView contentContainerStyle={{padding:24,gap:18}} keyboardShouldPersistTaps="handled">
 <Text>Practical ideas based on your goals, diet and recent logs. Review all estimates and check ingredients for allergens.</Text>
 <View style={{flexDirection:'row',gap:8}}>{(['coach','plan','text'] as const).map(m=><Pressable key={m} onPress={()=>setMode(m)} style={{padding:12,borderRadius:14,backgroundColor:m===mode?'#d7f8aa':'#eee'}}><Text>{m==='text'?'Log food':m==='plan'?'Meal ideas':'Ask coach'}</Text></Pressable>)}</View>
 {mode==='coach'?history.map((item,i)=><View key={i} style={{padding:16,borderRadius:16,backgroundColor:item.role==='user'?'#f3f3f3':'#eff8e5'}}><Text style={{fontWeight:'700',marginBottom:8}}>{item.role==='user'?'You':'Coach'}</Text><Text style={{lineHeight:23}}>{item.content}</Text></View>):null}
 {mode==='plan'?<><Text>{notes}</Text>{meals.map((meal,i)=><View key={i} style={{padding:18,backgroundColor:'#f4f6f0',borderRadius:18,gap:12}}><Text style={{fontSize:19,fontWeight:'700'}}>{meal.name}</Text><Text>{meal.ingredients.join(', ')}</Text><Text>{meal.instructions}</Text><Text>{Math.round(meal.calories)} kcal · {Math.round(meal.protein)} g protein</Text><Button title="Save meal idea" onPress={async()=>{
 const id=Crypto.randomUUID();const recipe:MealRecipe={id,name:meal.name,description:`${meal.ingredients.join(', ')}\n\n${meal.instructions}`,servings:1,ingredients:[{id:`${id}_meal`,name:meal.name,servingSize:'1 serving (estimate)',calories:meal.calories,protein:meal.protein,carbs:meal.carbs,fat:meal.fat,fiber:meal.fiber,source:'ai'}],totalCalories:meal.calories,totalProtein:meal.protein,totalCarbs:meal.carbs,totalFat:meal.fat,createdAt:new Date().toISOString()};await actions.saveMealRecipe(recipe);Alert.alert('Saved','Find this meal in Saved Foods.');
 }}/></View>)}</>:null}
 <TextField label={mode==='text'?'Describe what you ate':mode==='plan'?'What would you like to cook?':'Ask about food or fitness'} value={message} onChangeText={setMessage} multiline placeholder="Include portions, ingredients, preferences or time available…"/>
 <VoiceInput onText={setMessage}/><Button title={mode==='text'?'Analyze food':mode==='plan'?'Suggest meals':'Send'} onPress={submit} loading={busy} disabled={busy||!message.trim()}/>
 </ScrollView></SafeAreaView>;
}
