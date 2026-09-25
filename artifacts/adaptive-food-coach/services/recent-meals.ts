import type { DailyFoodLog } from '@/types';
import type { LastMealDish } from '@/constants/lastMeals';
export function recentMeals(logs: DailyFoodLog[]): LastMealDish[] {
 return logs.flatMap(d=>d.entries).sort((a,b)=>b.loggedAt.localeCompare(a.loggedAt)).slice(0,30).map(e=>({
  id:e.id,name:e.food.name,titleLine1:e.food.name,image:e.food.image?{uri:e.food.image}:require('@/assets/images/icon.png'),heroImage:require('@/assets/images/icon.png'),
  calories:Math.round(e.food.calories*e.quantity),protein:Math.round(e.food.protein*e.quantity),carbs:Math.round(e.food.carbs*e.quantity),fat:Math.round(e.food.fat*e.quantity),fiber:(e.food.fiber??0)*e.quantity,sodium:(e.food.sodium??0)*e.quantity,sugar:0,healthScore:0,
  verification:{status:'pending',label:e.addedBy ?? (e.food.source==='ai'?'AI estimate · reviewed by you':'Logged by you')},ingredients:[],segments:[],
  addedBy:e.addedBy,
 }));
}
