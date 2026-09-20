import React,{useState} from 'react';
import {Alert,ScrollView,Text,View,Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {Button,Header,TextField} from '@/components/ui';
import {scanDraft,setScanDraft} from '@/services/ai';
import {appStoreActions} from '@/hooks/useAppStore';
import {foodSchema} from '@workspace/backend-contracts';
import type {MealType,FoodItem} from '@/types';
import {errorMessage} from '@/services/api';
export default function ReviewScan(){
 const router=useRouter();const [draft]=useState(scanDraft),[foods,setFoods]=useState(scanDraft?.foods??[]),[mealType,setMealType]=useState<MealType>('lunch'),[busy,setBusy]=useState(false);
 const edit=(i:number,patch:Partial<FoodItem>)=>setFoods(fs=>fs.map((f,j)=>j===i?{...f,...patch}:f));
 const save=async()=>{if(busy)return;setBusy(true);try{
  foods.forEach(f=>foodSchema.parse(f));const date=new Date();const localDate=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  await appStoreActions.logFoods(foods.map(food=>({food,quantity:1})),mealType,localDate);setScanDraft(null);router.replace('/(tabs)');
 }catch(e){Alert.alert('Check your food details',errorMessage(e));}finally{setBusy(false);}};
 return <SafeAreaView style={{flex:1,backgroundColor:'#fff'}}><Header title="Review your food"/><ScrollView contentContainerStyle={{padding:24,gap:20}}>
  <Text>{draft?.notes??'No pending scan. Take a photo or describe your food.'}</Text>
  <Text>Check the foods, portions and nutrition before adding them. Photo estimates cannot verify allergens.</Text>
  {foods.map((food,i)=><View key={food.id} style={{padding:18,backgroundColor:'#f5f5f5',borderRadius:18,gap:12}}>
   {food.confidence!==undefined?<Text>AI confidence: {Math.round(food.confidence*100)}%</Text>:null}
   {food.warnings?.map((w,j)=><Text key={j} style={{color:'#915900'}}>{w}</Text>)}
   <TextField label="Food" value={food.name} onChangeText={name=>edit(i,{name})}/><TextField label="Portion represented by these values" value={food.servingSize} onChangeText={servingSize=>edit(i,{servingSize})}/>
   {(['calories','protein','carbs','fat','fiber','sodium'] as const).map(k=><TextField key={k} label={`${k} (${k==='calories'?'kcal':k==='sodium'?'mg':'g'})`} keyboardType="decimal-pad" value={String(food[k]??0)} onChangeText={v=>edit(i,{[k]:Number(v)})}/>)}
   <Pressable onPress={()=>setFoods(fs=>fs.filter((_,j)=>j!==i))}><Text style={{color:'#b42318'}}>Remove food</Text></Pressable>
  </View>)}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{(['breakfast','lunch','dinner','snack'] as const).map(type=><Pressable key={type} onPress={()=>setMealType(type)} style={{padding:10,backgroundColor:mealType===type?'#d7f8aa':'#eee',borderRadius:12}}><Text>{type}</Text></Pressable>)}</View>
  <Button title="Confirm and log food" loading={busy} disabled={!foods.length||busy} onPress={save}/>
 </ScrollView></SafeAreaView>;
}
