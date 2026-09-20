import React from 'react';
import {Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Header} from '@/components/ui';
export default function Subscription(){return <SafeAreaView style={{flex:1,backgroundColor:'#fff'}}><Header title="Your plan"/><View style={{padding:28,gap:18}}><Text style={{fontSize:28,fontWeight:'700'}}>Free</Text><Text style={{fontSize:16,lineHeight:24}}>This release is free. Food logging, activity tracking, community and AI assistance are included. AI requests have a daily fair-use limit.</Text></View></SafeAreaView>;}
