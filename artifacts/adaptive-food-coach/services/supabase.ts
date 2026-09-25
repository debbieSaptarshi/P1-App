import 'react-native-url-polyfill/auto';
import '@/services/webcrypto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
export const backendConfigured = !!url && !!key && !!process.env.EXPO_PUBLIC_API_URL;
// Chunk sessions for native secure storage implementations with small value limits.
const secureStorage = {
 async getItem(key: string) {
  const count = Number(await SecureStore.getItemAsync(`${key}.count`));
  if (!count || count > 32) return null;
  const parts = await Promise.all(Array.from({length:count},(_,i)=>SecureStore.getItemAsync(`${key}.${i}`)));
  return parts.every(p=>p!==null) ? parts.join('') : null;
 },
 async setItem(key: string, value: string) {
  const parts = value.match(/[\s\S]{1,1800}/g) ?? [];
  if (parts.length > 32) throw new Error('Session is too large to store securely.');
  const oldCount=Number(await SecureStore.getItemAsync(`${key}.count`))||0;
  await SecureStore.deleteItemAsync(`${key}.count`);
  for(let i=0;i<parts.length;i++)await SecureStore.setItemAsync(`${key}.${i}`,parts[i]);
  await SecureStore.setItemAsync(`${key}.count`,String(parts.length));
  for(let i=parts.length;i<oldCount;i++)await SecureStore.deleteItemAsync(`${key}.${i}`);
 },
 async removeItem(key: string) {
  const count=Number(await SecureStore.getItemAsync(`${key}.count`))||0;
  await SecureStore.deleteItemAsync(`${key}.count`);
  for(let i=0;i<Math.min(count,32);i++)await SecureStore.deleteItemAsync(`${key}.${i}`);
 },
};
export const supabase = url && key ? createClient(url,key,{
 auth:{storage:Platform.OS==='web'?AsyncStorage:secureStorage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,flowType:'pkce'},
}) : null;
if(Platform.OS!=='web' && supabase){
 AppState.addEventListener('change',state=>{if(state==='active')supabase.auth.startAutoRefresh();else supabase.auth.stopAutoRefresh();});
}
export function authClient(){if(!supabase)throw new Error('Configure Supabase in the Expo .env file first.');return supabase;}
