import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { backendConfigured, demoMode, supabase } from '@/services/supabase';
import { initializeAccount, retrySync, resolveSyncConflict, useAppStore } from '@/hooks/useAppStore';
import { errorMessage } from '@/services/api';
export function AuthGate({children}:{children:React.ReactNode}){
 const router=useRouter(),segments=useSegments(),navigation=useRootNavigationState();
 const [userId,setUserId]=useState<string|null>(null),[loading,setLoading]=useState(!demoMode),[error,setError]=useState('');
 const {hydrated,state,syncStatus,syncMessage}=useAppStore();
 useEffect(()=>{
  if(demoMode||!supabase){setLoading(false);return;}
  let alive=true;let generation=0;
  const apply=async(user:any)=>{
   const current=++generation;setLoading(true);setError('');setUserId(user?.id??null);
   try{await initializeAccount(user);}catch(e){if(alive&&current===generation)setError(errorMessage(e));}
   finally{if(alive&&current===generation)setLoading(false);}
  };
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
   // Leave the auth callback synchronously before calling getSession via API.
   setTimeout(()=>{if(alive)void apply(session?.user??null);},0);
  });
  return()=>{alive=false;subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(demoMode||!backendConfigured||loading||error||!navigation?.key)return;
  const auth=segments[0]==='(auth)';
  const authScreen=(segments as string[])[1];
  if(!userId&&!auth)router.replace('/(auth)/sign-in');
  else if(userId&&hydrated&&(!auth||authScreen==='sign-in'||authScreen==='register')){
   if(!state.onboarding.complete&&segments[0]!=='(onboarding)')router.replace('/(onboarding)/welcome');
   else if(state.onboarding.complete&&(auth||segments[0]==='(onboarding)'))router.replace('/(tabs)');
  }
 },[userId,loading,error,hydrated,state.onboarding.complete,segments,navigation?.key]);
 if(!backendConfigured&&!demoMode)return <View style={styles.cover}><Text style={styles.title}>Connect your backend</Text><Text style={styles.copy}>Add the Supabase URL, public key, and API URL to the Expo .env file, then restart Expo. See docs/BACKEND.md for local setup.</Text><Text style={styles.copy}>To preview the original sample screens, explicitly enable EXPO_PUBLIC_DEMO_MODE=true.</Text></View>;
 return <View style={{flex:1}}>{children}
  {demoMode?<View style={styles.banner}><Text>Demo preview · sample data · cloud features disabled</Text></View>:null}
  {(loading||error)?<View style={styles.cover}>{loading?<ActivityIndicator/>:<><Text style={styles.title}>Unable to load your account</Text><Text style={styles.copy}>{error}</Text><Pressable onPress={async()=>{setLoading(true);try{const {data}=await supabase!.auth.getUser();await initializeAccount(data.user);setError('');}catch(e){setError(errorMessage(e));}finally{setLoading(false);}}}><Text>Retry</Text></Pressable></>}</View>:null}
  {!loading&&!error&&userId&&['offline','error','conflict'].includes(syncStatus)?<View style={styles.banner}>
   <Text>{syncStatus==='conflict'?'Changes found on another device.':syncStatus==='offline'?'Saved on this device. Waiting to sync.':syncMessage}</Text>
   {syncStatus==='conflict'?<View style={{flexDirection:'row',gap:20}}><Pressable onPress={()=>void resolveSyncConflict(false)?.catch(e=>setError(errorMessage(e)))}><Text>Use cloud changes</Text></Pressable><Pressable onPress={()=>void resolveSyncConflict(true)?.catch(e=>setError(errorMessage(e)))}><Text>Keep my edits</Text></Pressable></View>:<Pressable onPress={()=>void retrySync()}><Text style={{fontWeight:'bold'}}>Retry sync</Text></Pressable>}
  </View>:null}
 </View>;
}
const styles=StyleSheet.create({cover:{position:'absolute',top:0,bottom:0,left:0,right:0,zIndex:100,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',padding:28,gap:20},title:{fontSize:22,fontWeight:'700'},copy:{fontSize:15,lineHeight:23,textAlign:'center'},banner:{position:'absolute',top:50,left:12,right:12,backgroundColor:'#fff0ce',padding:12,borderRadius:12,gap:8,zIndex:90}});
