// Public values only. Never add a service-role key.
const SUPABASE_URL = 'https://jbzbnidtcmywmudfjipv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7al2fxpUzrjpzicCfGPvew_kgEm7KqA';

export type HeartSnapshot = {counts: Record<string, number>; mine: Record<string, boolean>; busy: Record<string, boolean>; mode: 'local'|'shared'; message: string};
const LOCAL_KEY = 'bpgc-hearts-v1';
const SESSION_KEY = 'bpgc-heart-session-v1';
const local = (): string[] => { try { const x = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); return Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : []; } catch { return []; } };

class HeartStore {
  private listeners = new Set<() => void>();
  private state: HeartSnapshot = {counts: {}, mine: {}, busy: {}, mode: 'local', message: ''};
  private access = ''; private refresh = ''; private expires = 0;
  constructor() {
    for (const id of local()) { this.state.mine[id] = true; this.state.counts[id] = 1; }
    if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && typeof window !== 'undefined') { this.state = {...this.state, mode: 'shared', counts: {}, mine: {}}; void this.init(); }
  }
  snapshot = () => this.state;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private update(p: Partial<HeartSnapshot>) { this.state = {...this.state, ...p}; this.listeners.forEach(fn => fn()); }
  private async request(path: string, body?: unknown, token?: string) {
    const r = await fetch(`${SUPABASE_URL}${path}`, {method: body === undefined ? 'GET' : 'POST', headers: {apikey: SUPABASE_PUBLISHABLE_KEY, ...(token ? {Authorization: `Bearer ${token}`} : {}), 'Content-Type': 'application/json'}, body: body === undefined ? undefined : JSON.stringify(body)});
    if (!r.ok) throw Error(`Heart service ${r.status}`);
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  }
  private store(data: {access_token?: string; refresh_token?: string; expires_in?: number}) {
    if (!data?.access_token || !data.refresh_token) throw Error('No heart session');
    this.access = data.access_token; this.refresh = data.refresh_token; this.expires = Date.now() + (data.expires_in || 3600) * 1000;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({refresh_token: this.refresh})); } catch { /* ignore */ }
    return this.access;
  }
  private async session() {
    if (!this.refresh) { try { this.refresh = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}').refresh_token || ''; } catch { /* ignore */ } }
    if (this.access && Date.now() < this.expires - 60000) return this.access;
    if (this.refresh) {
      try { return this.store(await this.request('/auth/v1/token?grant_type=refresh_token', {refresh_token: this.refresh})); }
      catch { this.refresh = ''; try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } }
    }
    return this.store(await this.request('/auth/v1/signup', {data: {}}));
  }
  private async init() {
    try {
      const token = await this.session();
      const [counts, mine] = await Promise.all([this.request('/rest/v1/rpc/heart_counts', {}, token), this.request('/rest/v1/rpc/my_hearts', {}, token)]);
      const tally: Record<string, number> = {}, mineMap: Record<string, boolean> = {};
      for (const row of counts) tally[row.item_id] = Number(row.hearts);
      for (const row of mine) mineMap[row.item_id] = true;
      this.update({counts: tally, mine: mineMap, message: ''});
    } catch { this.update({message: 'Likes are unavailable right now.'}); }
  }
  async like(id: string) {
    if (this.state.busy[id]) return;
    const removing = !!this.state.mine[id];
    const mine = {...this.state.mine}, counts = {...this.state.counts};
    if (removing) delete mine[id]; else mine[id] = true;
    counts[id] = Math.max(0, (counts[id] || 0) + (removing ? -1 : 1));
    if (this.state.mode === 'local') {
      this.update({mine, counts});
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(Object.keys(mine))); } catch { /* ignore */ }
      return;
    }
    // Optimistic: update just this item, roll back on failure. No full refetch.
    const before = {mine: this.state.mine, counts: this.state.counts};
    this.update({mine, counts, busy: {...this.state.busy, [id]: true}, message: ''});
    try { await this.request('/rest/v1/rpc/heart_item', {p_item_id: id, p_liked: !removing}, await this.session()); }
    catch { this.update({...before, message: 'Could not save that like. Try again.'}); }
    finally { const busy = {...this.state.busy}; delete busy[id]; this.update({busy}); }
  }
}
export const hearts = new HeartStore();
