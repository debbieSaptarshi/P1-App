import { authClient } from './supabase';
export class ApiError extends Error {
 constructor(public status:number,public code:string,message:string){super(message);}
}
export async function api<T>(path:string,options: {method?:string;body?:unknown;idempotencyKey?:string;signal?:AbortSignal}={}):Promise<T>{
 const base=process.env.EXPO_PUBLIC_API_URL;
 if(!base)throw new ApiError(503,'NOT_CONFIGURED','Configure EXPO_PUBLIC_API_URL to connect the backend.');
 if(!__DEV__ && /localhost|127\.0\.0\.1/i.test(base))throw new ApiError(503,'NOT_CONFIGURED','This release is missing its production API URL.');
 const {data:{session},error}=await authClient().auth.getSession();
 if(error||!session)throw new ApiError(401,'AUTH_REQUIRED','Please sign in.');
 const response=await fetch(`${base.replace(/\/$/,'')}/api/v1${path}`,{
  method:options.method??'GET',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options.idempotencyKey?{'Idempotency-Key':options.idempotencyKey}:{})},
  body:options.body===undefined?undefined:JSON.stringify(options.body),signal:options.signal??AbortSignal.timeout(90000),
 });
 if(!response.ok){const body=await response.json().catch(()=>null);throw new ApiError(response.status,body?.error?.code??'REQUEST_FAILED',body?.error?.message??'The request failed. Please try again.');}
 if(response.status===204)return undefined as T;
 return response.json();
}
export function errorMessage(error:unknown){return error instanceof Error?error.message:'Something went wrong. Please try again.';}
