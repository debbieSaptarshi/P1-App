import React,{useState} from 'react';
import {Alert,ScrollView,Share,Text,View,Platform,Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import {File,Paths} from 'expo-file-system';
import {Button,Header,TextField} from '@/components/ui';
import {api,errorMessage} from '@/services/api';
import {authClient} from '@/services/supabase';
import {useAppStore,initializeAccount,clearAccountCache} from '@/hooks/useAppStore';
export default function Privacy(){
 const {state,actions}=useAppStore();const [confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false);
 return <SafeAreaView style={{flex:1,backgroundColor:'#fff'}}><Header title="Privacy & data"/><ScrollView contentContainerStyle={{padding:24,gap:24}}>
 <Text>Your logs are private to your account. Joining a community group shares your display name and logging-day score. Photos and audio are sent to the configured AI provider only when you use AI features; the backend does not retain the media.</Text>
 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text>Allow AI assistance</Text><Switch value={!!state.preferences.aiConsent} onValueChange={value=>void actions.setAiConsent(value)}/></View>
 <Button title="Export my data" disabled={busy} onPress={async()=>{setBusy(true);try{const result=await api<unknown>('/account/export');const json=JSON.stringify(result,null,2);if(Platform.OS==='web'){const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='food-coach-export.json';a.click();URL.revokeObjectURL(url);}else{const file=new File(Paths.cache,'food-coach-export.json');file.write(json);await Sharing.shareAsync(file.uri,{mimeType:'application/json',dialogTitle:'Export my food coach data'});}}catch(e){Alert.alert('Export failed',errorMessage(e));}finally{setBusy(false);}}}/>
 <Text style={{fontSize:19,fontWeight:'700'}}>Delete account</Text><Text>This permanently deletes your account, logs, AI results, posts, comments and memberships. Export any data you want to keep first.</Text><TextField label="Type DELETE to confirm" value={confirmation} onChangeText={setConfirmation}/>
 <Button title="Permanently delete account" disabled={confirmation!=='DELETE'||busy} loading={busy} onPress={async()=>{setBusy(true);try{await api('/account',{method:'DELETE',body:{confirmation}});await clearAccountCache();await authClient().auth.signOut({scope:'local'});await initializeAccount(null);}catch(e){Alert.alert('Deletion failed',errorMessage(e));}finally{setBusy(false);}}}/>
 </ScrollView></SafeAreaView>;
}
