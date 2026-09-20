import React,{useEffect,useState} from 'react';
import {Alert,Pressable,Text} from 'react-native';
import {AudioModule,RecordingPresets,setAudioModeAsync,useAudioRecorder,useAudioRecorderState} from 'expo-audio';
import * as Crypto from 'expo-crypto';
import {fileBase64,requestAiConsent} from '@/services/ai';
import {api,errorMessage} from '@/services/api';
import {useAppStore} from '@/hooks/useAppStore';
export function VoiceInput({onText}:{onText:(text:string)=>void}){
 const recorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY),status=useAudioRecorderState(recorder);const [busy,setBusy]=useState(false);const {state}=useAppStore();
 const stop=async()=>{setBusy(true);try{await recorder.stop();await setAudioModeAsync({allowsRecording:false});if(!recorder.uri)throw new Error('No recording captured.');const result=await api<{text:string}>('/ai/transcribe',{method:'POST',idempotencyKey:Crypto.randomUUID(),body:{base64:await fileBase64(recorder.uri),consent:true}});onText(result.text);}catch(e){Alert.alert('Voice input',errorMessage(e));}finally{setBusy(false);}};
 useEffect(()=>{if(status.isRecording&&status.durationMillis>=60000&&!busy)void stop();},[status.durationMillis]);
 return <Pressable disabled={busy} onPress={async()=>{
  if(status.isRecording){await stop();return;}setBusy(true);
  try{await requestAiConsent(state.preferences.aiConsent);const permission=await AudioModule.requestRecordingPermissionsAsync();if(!permission.granted)throw new Error('Microphone permission is needed. You can type instead.');await setAudioModeAsync({allowsRecording:true,playsInSilentMode:true});await recorder.prepareToRecordAsync();recorder.record();}
  catch(e){Alert.alert('Voice input',errorMessage(e));}finally{setBusy(false);}
 }} style={{padding:14,borderRadius:12,backgroundColor:status.isRecording?'#ffdddd':'#eef3e8'}}><Text>{busy?'Transcribing…':status.isRecording?`Stop recording · ${Math.floor(status.durationMillis/1000)}s`:'Dictate (up to 60 seconds)'}</Text></Pressable>;
}
