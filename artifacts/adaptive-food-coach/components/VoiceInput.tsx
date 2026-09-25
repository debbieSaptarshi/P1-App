import React,{useEffect,useState} from 'react';
import {ActivityIndicator,Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {AudioModule,RecordingPresets,setAudioModeAsync,useAudioRecorder,useAudioRecorderState} from 'expo-audio';
import * as Crypto from 'expo-crypto';
import {fileBase64,requestAiConsent} from '@/services/ai';
import {api,errorMessage} from '@/services/api';
import {useAppStore} from '@/hooks/useAppStore';
import {colors} from '@/constants/tokens';
export function VoiceInput({onText,compact=false,onRecordingChange}:{onText:(text:string)=>void;compact?:boolean;onRecordingChange?:(recording:boolean)=>void}){
 const recorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY),status=useAudioRecorderState(recorder);const [busy,setBusy]=useState(false);const {state}=useAppStore();
 const stop=async()=>{setBusy(true);try{await recorder.stop();await setAudioModeAsync({allowsRecording:false});if(!recorder.uri)throw new Error('No recording captured.');const result=await api<{text:string}>('/ai/transcribe',{method:'POST',idempotencyKey:Crypto.randomUUID(),body:{base64:await fileBase64(recorder.uri),consent:true}});onText(result.text);}catch(e){Alert.alert('Voice input',errorMessage(e));}finally{setBusy(false);}};
 useEffect(()=>{if(status.isRecording&&status.durationMillis>=60000&&!busy)void stop();},[status.durationMillis]);
 useEffect(()=>{onRecordingChange?.(status.isRecording);},[status.isRecording]);
 const toggle=async()=>{
  if(status.isRecording){await stop();return;}setBusy(true);
  try{await requestAiConsent(state.preferences.aiConsent);const permission=await AudioModule.requestRecordingPermissionsAsync();if(!permission.granted)throw new Error('Microphone permission is needed. You can type instead.');await setAudioModeAsync({allowsRecording:true,playsInSilentMode:true});await recorder.prepareToRecordAsync();recorder.record();}
  catch(e){Alert.alert('Voice input',errorMessage(e));}finally{setBusy(false);}
 };
 if(compact){
  return <Pressable disabled={busy} onPress={toggle} accessibilityRole="button" accessibilityLabel={status.isRecording?'Stop recording':'Dictate'} accessibilityState={{busy,selected:status.isRecording}} style={({pressed})=>[styles.compact,status.isRecording&&styles.compactOn,pressed&&styles.pressed]}>
   {busy?<ActivityIndicator size="small" color={colors.textMuted}/>:<Feather name={status.isRecording?'square':'mic'} size={18} color={status.isRecording?colors.textInverse:colors.textMuted}/>}
   {status.isRecording?<View style={styles.dot}/>:null}
  </Pressable>;
 }
 return <Pressable disabled={busy} onPress={toggle} style={{padding:14,borderRadius:12,backgroundColor:status.isRecording?'#ffdddd':'#eef3e8'}}><Text>{busy?'Transcribing…':status.isRecording?`Stop recording · ${Math.floor(status.durationMillis/1000)}s`:'Dictate (up to 60 seconds)'}</Text></Pressable>;
}
const styles=StyleSheet.create({
 compact:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
 compactOn:{backgroundColor:colors.accentRed},
 dot:{position:'absolute',top:4,right:4,width:8,height:8,borderRadius:4,backgroundColor:colors.textInverse},
 pressed:{opacity:0.7},
});
