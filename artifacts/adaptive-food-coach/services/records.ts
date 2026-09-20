import type { CloudRecord, Collection } from '@workspace/backend-contracts';
import { seedFoodDatabase } from '@/hooks/seedFoodDatabase';
import { mergeFoodCatalog } from '@/constants/logFoodCatalog';
const catalog = new Map(mergeFoodCatalog(seedFoodDatabase).map(f => [f.id, JSON.stringify(f)]));
import type { PersistedState } from '@/hooks/useAppStore';
export function toRecords(state:PersistedState):CloudRecord[]{
 const result:CloudRecord[]=[];
 const add=(collection:Collection,id:string,data:unknown)=>result.push({collection,id,data:JSON.parse(JSON.stringify(data))});
 add('profile','self',state.profile);add('onboarding','self',state.onboarding);add('preferences','self',state.preferences);for(const step of state.steps)add('steps',step.date,step);
 for(const food of state.foodDatabase)if(catalog.get(food.id)!==JSON.stringify(food))add('foods',food.id,food);
 for(const day of state.foodLogs){add('hydration',day.date,{date:day.date,waterMl:day.waterMl??0});for(const entry of day.entries)add('food_entries',entry.id,entry);}
 for(const [collection,list] of [['saved_foods',state.savedFoods],['recipes',state.mealRecipes],['exercise',state.exerciseLogs],['weights',state.weightHistory]] as const)for(const item of list)add(collection,item.id,item);
 return result;
}
export function fromRecords(records:CloudRecord[],empty:PersistedState):PersistedState{
 const next:PersistedState={...empty,foodDatabase:[...empty.foodDatabase],steps:[],foodLogs:[],savedFoods:[],mealRecipes:[],exerciseLogs:[],weightHistory:[]};
 const days=new Map<string,PersistedState['foodLogs'][number]>();
 const day=(date:string)=>{if(!days.has(date))days.set(date,{date,entries:[],waterMl:0,totals:{calories:0,protein:0,carbs:0,fat:0,fiber:0,sodium:0}});return days.get(date)!;};
 for(const record of records){const data=record.data as any;
  switch(record.collection){
   case 'profile':next.profile=data;break;
   case 'preferences':next.preferences=data;break;
   case 'onboarding':next.onboarding=data;break;
   case 'foods':next.foodDatabase=next.foodDatabase.filter(f=>f.id!==data.id);next.foodDatabase.push(data);break;
   case 'food_entries':{const d=day(data.date);d.entries.push(data);for(const k of Object.keys(d.totals) as (keyof typeof d.totals)[])d.totals[k]+=(data.food[k]??0)*data.quantity;break;}
   case 'hydration':day(data.date).waterMl=data.waterMl;break;
   case 'saved_foods':next.savedFoods.push(data);break;
   case 'recipes':next.mealRecipes.push(data);break;
   case 'exercise':next.exerciseLogs.push(data);break;
   case 'weights':next.weightHistory.push(data);break;
   case 'steps':next.steps.push(data);break;
  }
 }
 next.foodLogs=[...days.values()].sort((a,b)=>b.date.localeCompare(a.date));
 next.weightHistory.sort((a,b)=>b.date.localeCompare(a.date));next.exerciseLogs.sort((a,b)=>b.date.localeCompare(a.date));
 return next;
}
