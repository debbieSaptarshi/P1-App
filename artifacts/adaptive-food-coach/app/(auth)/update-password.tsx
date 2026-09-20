import React,{useState} from 'react';
import {Alert,View,Text} from 'react-native';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button,Header,TextField} from '@/components/ui';
import {authClient} from '@/services/supabase';
import {errorMessage} from '@/services/api';
export default function UpdatePassword(){
 const router=useRouter();const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false);
 return <SafeAreaView style={{flex:1,backgroundColor:'#fff',padding:24}}><Header title="Choose a new password"/><View style={{gap:20,marginTop:30}}><Text>Use at least 8 characters.</Text><TextField label="New password" value={password} onChangeText={setPassword} secureTextEntry/><TextField label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry/><Button title="Save password" loading={busy} disabled={password.length<8||password!==confirm||busy} onPress={async()=>{setBusy(true);try{const {error}=await authClient().auth.updateUser({password});if(error)throw error;router.replace('/(auth)/reset-success');}catch(e){Alert.alert('Unable to reset password',errorMessage(e));}finally{setBusy(false);}}}/></View></SafeAreaView>;
}
