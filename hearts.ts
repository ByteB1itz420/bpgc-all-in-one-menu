// Public values only. Set both after creating the Supabase project. Never add a service-role key.
const SUPABASE_URL = 'https://jbzbnidtcmywmudfjipv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7al2fxpUzrjpzicCfGPvew_kgEm7KqA';

export type HeartSnapshot={counts:Record<string,number>;mine:Record<string,boolean>;busy:Record<string,boolean>;mode:'local'|'shared';message:string};
export const itemId=(outlet:number,category:number,item:number)=>`o${outlet}-c${category}-i${item}`;
const storageKey='bpgc-hearts-v1';
const local=():string[]=>{try{const x=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(x)?x.filter((v):v is string=>typeof v==='string'):[]}catch{return []}};
class HeartStore {
 private listeners=new Set<(s:HeartSnapshot)=>void>();
 private state:HeartSnapshot={counts:{},mine:{},busy:{},mode:'local',message:''};
 private access='';private refresh='';private expires=0;
 constructor(){for(const id of local()){this.state.mine[id]=true;this.state.counts[id]=1}
  if(SUPABASE_URL&&SUPABASE_PUBLISHABLE_KEY){this.state.mode='shared';this.state.counts={};this.state.mine={};this.state.message='Loading student hearts…';void this.init()}}
 snapshot=()=>this.state;
 subscribe=(fn:(s:HeartSnapshot)=>void)=>{this.listeners.add(fn);fn(this.state);return()=>{this.listeners.delete(fn)}};
 private update(p:Partial<HeartSnapshot>){this.state={...this.state,...p};this.listeners.forEach(fn=>fn(this.state))}
 private async request(path:string,body?:unknown,token?:string){const r=await fetch(`${SUPABASE_URL}${path}`,{method:body===undefined?'GET':'POST',headers:{'apikey':SUPABASE_PUBLISHABLE_KEY,...(token?{'Authorization':`Bearer ${token}`} : {}),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw Error(`Heart service ${r.status}`);const text=await r.text();return text?JSON.parse(text):null}
 private async session(){const key='bpgc-heart-session-v1';if(!this.refresh){try{this.refresh=JSON.parse(localStorage.getItem(key)||'{}').refresh_token||''}catch{}}
  if(this.access&&Date.now()<this.expires-60000)return this.access;
  try{const data=this.refresh?await this.request('/auth/v1/token?grant_type=refresh_token',{refresh_token:this.refresh}):await this.request('/auth/v1/signup',{data:{}});
   if(!data.access_token||!data.refresh_token)throw Error('No heart session');this.access=data.access_token;this.refresh=data.refresh_token;this.expires=Date.now()+(data.expires_in||3600)*1000;localStorage.setItem(key,JSON.stringify({refresh_token:this.refresh}));return this.access
  }catch(e){if(this.refresh){this.refresh='';localStorage.removeItem(key);const data=await this.request('/auth/v1/signup',{data:{}});if(!data.access_token||!data.refresh_token)throw Error('No heart session');this.access=data.access_token;this.refresh=data.refresh_token;this.expires=Date.now()+(data.expires_in||3600)*1000;localStorage.setItem(key,JSON.stringify({refresh_token:this.refresh}));return this.access}throw e}}
 private async init(){try{const token=await this.session();const [counts,mine]=await Promise.all([this.request('/rest/v1/rpc/heart_counts',{},token),this.request('/rest/v1/rpc/my_hearts',{},token)]);const tally:Record<string,number>={},mineMap:Record<string,boolean>={};for(const row of counts)tally[row.item_id]=Number(row.hearts);for(const row of mine)mineMap[row.item_id]=true;this.update({counts:tally,mine:mineMap,message:''})}catch{this.update({message:'Student hearts are temporarily unavailable. Try reloading.'})}}
 async like(id:string){if(this.state.busy[id])return;
  const removing=!!this.state.mine[id];
  if(this.state.mode==='local'){const mine={...this.state.mine},counts={...this.state.counts};if(removing){delete mine[id];delete counts[id]}else{mine[id]=true;counts[id]=1}this.update({mine,counts});try{localStorage.setItem(storageKey,JSON.stringify(Object.keys(mine)))}catch{}return}
  this.update({busy:{...this.state.busy,[id]:true},message:''});try{const token=await this.session();await this.request('/rest/v1/rpc/heart_item',{p_item_id:id,p_liked:!removing},token);const counts=await this.request('/rest/v1/rpc/heart_counts',{},token);const tally:Record<string,number>={};for(const row of counts)tally[row.item_id]=Number(row.hearts);const mine={...this.state.mine};if(removing)delete mine[id];else mine[id]=true;this.update({counts:tally,mine,message:''})}catch{this.update({message:'Could not update that heart. Try again.'})}finally{const busy={...this.state.busy};delete busy[id];this.update({busy})}}
}
export const hearts=new HeartStore();
