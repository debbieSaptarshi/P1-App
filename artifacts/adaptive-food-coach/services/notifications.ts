import {Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
export interface ReminderPreferences {daily?:boolean;weekly?:boolean;sound?:boolean;}
const ids=['food-coach-breakfast','food-coach-lunch','food-coach-dinner','food-coach-weekly'];
export async function clearReminders(){
 if(Platform.OS==='web')return;
 await Promise.all(ids.map(id=>Notifications.cancelScheduledNotificationAsync(id)));
}
export async function configureReminders(prefs:ReminderPreferences,requestPermission=true){
 if(Platform.OS==='web'){
  if(requestPermission&&(prefs.daily||prefs.weekly))throw new Error('Reminders are available in the iOS and Android app.');
  return;
 }
 if(prefs.daily||prefs.weekly){
  if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('food-coach-reminders',{name:'Food reminders',importance:Notifications.AndroidImportance.DEFAULT,sound:prefs.sound?'default':null});
  let permission=await Notifications.getPermissionsAsync();
  if(!permission.granted&&requestPermission)permission=await Notifications.requestPermissionsAsync();
  if(!permission.granted){if(requestPermission)throw new Error('Allow notifications in device settings to enable reminders.');return;}
 }
 await clearReminders();
 if(prefs.daily)for(const [index,hour] of [8,13,19].entries())await Notifications.scheduleNotificationAsync({identifier:ids[index],content:{title:'A moment for your meal',body:'Log what you ate and check in with your day.',sound:prefs.sound?'default':false},trigger:{type:Notifications.SchedulableTriggerInputTypes.DAILY,hour,minute:0,channelId:'food-coach-reminders'}});
 if(prefs.weekly)await Notifications.scheduleNotificationAsync({identifier:ids[3],content:{title:'Your weekly review',body:'Open Progress to reflect on your week.',sound:prefs.sound?'default':false},trigger:{type:Notifications.SchedulableTriggerInputTypes.WEEKLY,weekday:2,hour:9,minute:0,channelId:'food-coach-reminders'}});
}
