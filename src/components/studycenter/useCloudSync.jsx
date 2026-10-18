import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_DB, validate } from './engine.js';
import { mergeStudyData } from './cloud-merge.js';

// These values are PUBLIC browser configuration, not passwords or admin credentials.
// Supabase RLS protects the data; never use service_role or sb_secret here.
const SUPABASE_URL = (import.meta.env.PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_KEY = (import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();
const CONFIGURED = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL) &&
  (/^sb_publishable_[A-Za-z0-9_-]+$/.test(SUPABASE_KEY) || SUPABASE_KEY.startsWith('eyJ'));
const OWNER_KEY = 'studylab.cloud.account-owner.v1';
const DEVICE_KEY = 'studylab.cloud.device-id.v1';
const TIMESTAMP_KEY = 'studylab.cloud.last-sync.v1';
const LOCAL_DB_KEY = 'studylab.learning-center.v1';

function deviceId() {
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(id || '')) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}
function readableError(error) {
  const message = String(error?.message || error || 'Błąd połączenia');
  if (/Failed to fetch|NetworkError|fetch failed|offline/i.test(message)) return 'Nie ma połączenia z chmurą. Lokalne wyniki są zachowane; spróbujemy ponownie.';
  if (/relation.*does not exist|not found.*table|schema cache|42P01|PGRST205/i.test(message)) return 'Nie utworzono tabeli w Supabase. Uruchom dostarczony skrypt SQL.';
  if (/permission|policy|row-level|42501|403/i.test(message)) return 'Brak uprawnień. Sprawdź polityki RLS z pliku SQL.';
  return message.slice(0, 260);
}
const stamp = () => new Date().toISOString();
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function useCloudSync(db, setDb, ready) {
  const dbRef = useRef(db);
  const clientRef = useRef(null);
  const activeRef = useRef(null);
  const syncRef = useRef(() => Promise.resolve());
  const workingRef = useRef(false);
  const retryRef = useRef(false);
  const initializedRef = useRef(false);
  const [info, setInfo] = useState({configured: CONFIGURED, email:'', userId:null, phase:CONFIGURED?'logged-out':'unconfigured', lastSync:null, error:'', busy:false, githubLinked:false});
  useEffect(() => { dbRef.current = db; }, [db]);

  useEffect(() => {
    if (!ready || !CONFIGURED) return undefined;
    let mounted = true;
    const client = createClient(SUPABASE_URL.replace(/\/$/, ''), SUPABASE_KEY, {
      auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, flowType:'implicit'}
    });
    clientRef.current = client;
    // Default Supabase emails use confirmation/magic links. Keep track of a link
    // return so the user lands in StudyLab's Sync tab once auth completes.
    const returnedFromAuth = /(?:^|[&?])(?:access_token|refresh_token|type)=/.test(window.location.hash.slice(1)) ||
      /[?&]code=/.test(window.location.search);
    const set = patch => { if(mounted) setInfo(prev => ({...prev,...patch})); };

    const sync = async () => {
      const user = activeRef.current;
      if (!mounted || !user || !initializedRef.current) return;
      if (workingRef.current) { retryRef.current = true; return; }
      workingRef.current = true;
      set({phase:'syncing',error:''});
      try {
        // Each browser has its own row, so offline updates cannot overwrite another
        // browser's state. Fetch ALL device rows and merge history deterministically.
        const {data:rows, error:readError} = await client.from('study_sync_devices')
          .select('device_id,payload,updated_at').eq('user_id',user.id).limit(100);
        if (readError) throw readError;
        if (!mounted || activeRef.current?.id !== user.id) return;
        const snapshots = (rows || []).filter(r=>r?.payload?.version===1).map(r=>({
          ...r.payload, __cloudUpdatedAt: Date.parse(r.updated_at) || 0
        }));
        const merged = mergeStudyData(dbRef.current, ...snapshots);
        if (!equal(dbRef.current, merged)) {
          dbRef.current = merged;
          setDb(merged);
        }
        // Do not upload until the first cloud read succeeds (prevents overwriting
        // data when login happens on a new device or the network is unavailable).
        const currentRow = (rows || []).find(row => row.device_id === deviceId());
        if (!currentRow || !equal(validate(currentRow.payload), merged)) {
          // Include edits made while the request was pending.
          const upToDate = mergeStudyData(merged, dbRef.current);
          if (!equal(dbRef.current, upToDate)) {dbRef.current=upToDate;setDb(upToDate);}
          const {error:writeError} = await client.from('study_sync_devices').upsert({
            user_id:user.id, device_id:deviceId(), payload:upToDate, updated_at:stamp()
          }, {onConflict:'user_id,device_id'});
          if (writeError) throw writeError;
        }
        if (!mounted || activeRef.current?.id !== user.id) return;
        window.localStorage.setItem(OWNER_KEY,user.id);
        window.localStorage.setItem(TIMESTAMP_KEY,String(Date.now()));
        set({phase:'connected',error:'',lastSync:Date.now()});
      } catch(err) {
        if (mounted && activeRef.current?.id === user.id) set({phase:'error', error:readableError(err)});
      } finally {
        workingRef.current = false;
        if (retryRef.current && mounted) {
          retryRef.current=false;
          // Do not recurse synchronously while the next React update is pending.
          window.setTimeout(()=>{void sync();},1000);
        }
      }
    };
    syncRef.current = sync;
    const connect = user => {
      if (!mounted) return;
      if (!user) {
        activeRef.current=null;
        initializedRef.current=false;
        set({userId:null,email:'',phase:'logged-out',error:'',githubLinked:false});
        return;
      }
      const githubLinked = Boolean(user.identities?.some(identity => identity.provider === 'github') || user.app_metadata?.providers?.includes('github'));
      const bound = window.localStorage.getItem(OWNER_KEY);
      if (bound && bound !== user.id) {
        activeRef.current=null;
        initializedRef.current=false;
        set({userId:user.id,email:user.email || '',githubLinked,phase:'account-mismatch',error:'Na tym urządzeniu zapisano dane innego konta. Wymagana jest świadoma decyzja przed synchronizacją.'});
        return;
      }
      if (activeRef.current?.id === user.id && initializedRef.current) {set({githubLinked});return;}
      if(!bound)window.localStorage.setItem(OWNER_KEY,user.id);
      activeRef.current=user;
      initializedRef.current=true;
      set({userId:user.id,email:user.email || '',githubLinked,phase:'syncing',error:''});
      void sync();
    };
    const {data:{subscription}} = client.auth.onAuthStateChange((event,session) => {
      // Auth callbacks must not await Supabase queries; defer to a microtask.
      if (['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT'].includes(event))
        Promise.resolve().then(()=>{
          if (!mounted) return;
          connect(session?.user || null);
          if (returnedFromAuth && session?.user && (event==='SIGNED_IN' || event==='INITIAL_SESSION')) {
            // Replace only the fragment: the SDK consumes and clears session tokens.
            // Never copy auth tokens to other URLs or to app state.
            const cleanQuery = new URLSearchParams(window.location.search);
            cleanQuery.delete('code');
            const remaining = cleanQuery.toString();
            window.history.replaceState(null, '', window.location.pathname + (remaining?'?'+remaining:'') + '#sync');
            window.dispatchEvent(new Event('hashchange'));
          }
        });
    });
    client.auth.getSession().then(({data,error})=>{
      if(error)set({phase:'error',error:readableError(error)});
      else connect(data.session?.user || null);
    }).catch(err=>set({phase:'error',error:readableError(err)}));
    const interval = window.setInterval(()=>{if(!document.hidden)void sync();},45000);
    const wake = () => {if(!document.hidden)void sync();};
    window.addEventListener('online', wake);
    window.addEventListener('focus', wake);
    // Multiple tabs may share the same browser/device row. Merge their local
    // results rather than letting the last tab overwrite the other's history.
    const onStorage = event => {
      if (event.key !== LOCAL_DB_KEY || !event.newValue) return;
      try {
        const merged = mergeStudyData(dbRef.current, JSON.parse(event.newValue));
        if (!equal(merged,dbRef.current)) {dbRef.current=merged;setDb(merged);}
      } catch { /* Invalid or legacy data: keep this tab's safe local snapshot. */ }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      mounted=false;activeRef.current=null;initializedRef.current=false;
      subscription.unsubscribe();window.clearInterval(interval);
      window.removeEventListener('online',wake);window.removeEventListener('focus',wake);
      window.removeEventListener('storage',onStorage);
      syncRef.current=()=>Promise.resolve();
    };
  }, [ready,setDb]);

  useEffect(() => {
    if (!ready || info.phase === 'account-mismatch' || !info.userId) return undefined;
    const timeout = window.setTimeout(()=>{void syncRef.current();},1800);
    return () => window.clearTimeout(timeout);
  }, [db, ready, info.userId]);

  // Browser OAuth: GitHub redirects via Supabase back to the CURRENT page.
  // Do not request repository permissions and never handle the GitHub Client Secret here.
  async function signInWithGithub() {
    const client=clientRef.current;
    if(!client){setInfo(p=>({...p,error:'Najpierw skonfiguruj Supabase i uruchom strone.'}));return false;}
    setInfo(p=>({...p,busy:true,error:''}));
    try {
      const {error}=await client.auth.signInWithOAuth({
        provider:'github',options:{redirectTo:window.location.origin+window.location.pathname}
      });
      if(error)throw error;
      return true;
    }catch(err){setInfo(p=>({...p,error:readableError(err)}));return false;}
    finally{setInfo(p=>({...p,busy:false}));}
  }
  // Optional: links GitHub to the EXISTING signed-in Supabase user.
  // Supabase must have manual identity linking enabled for this route.
  async function linkGithub() {
    const client=clientRef.current;
    if(!client || !info.userId)return false;
    setInfo(p=>({...p,busy:true,error:''}));
    try {
      const {data,error:userError}=await client.auth.getUser();
      if(userError)throw userError;
      if(data.user?.id!==info.userId)throw new Error('Sesja nie pasuje do zalogowanego konta. Odswiez strone przed laczeniem kont.');
      const {error}=await client.auth.linkIdentity({
        provider:'github',options:{redirectTo:window.location.origin+window.location.pathname}
      });
      if(error)throw error;
      return true;
    }catch(err){setInfo(p=>({...p,error:readableError(err)}));return false;}
    finally{setInfo(p=>({...p,busy:false}));}
  }
  async function sendCode(email) {
    if (!clientRef.current) throw new Error('Najpierw skonfiguruj Supabase.');
    setInfo(p=>({...p,busy:true,error:''}));
    try {
      const {error} = await clientRef.current.auth.signInWithOtp({
        email:email.trim().toLowerCase(),
        options:{
          shouldCreateUser:true,
          // Redirect to the page hosting the cloud client (not the API /rest/v1 URL).
          // This URL must be allowed in Supabase Auth > URL Configuration.
          emailRedirectTo:window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
      return true;
    } catch(err) {setInfo(p=>({...p,error:readableError(err)}));return false;}
    finally {setInfo(p=>({...p,busy:false}));}
  }
  async function verifyCode(email,code) {
    if (!clientRef.current) return false;
    setInfo(p=>({...p,busy:true,error:''}));
    try {
      const {error} = await clientRef.current.auth.verifyOtp({email:email.trim().toLowerCase(),token:code.trim(),type:'email'});
      if (error) throw error;
      return true;
    } catch(err) {setInfo(p=>({...p,error:readableError(err)}));return false;}
    finally {setInfo(p=>({...p,busy:false}));}
  }
  async function signOut() {
    if (!clientRef.current) return;
    setInfo(p=>({...p,busy:true,error:''}));
    try {
      const {error} = await clientRef.current.auth.signOut({scope:'local'});
      if(error)throw error;
      activeRef.current=null;initializedRef.current=false;
      setInfo(p=>({...p,userId:null,email:'',phase:'logged-out',githubLinked:false,busy:false}));
    } catch(err) {setInfo(p=>({...p,busy:false,error:readableError(err)}));}
  }
  function replaceWithAccount() {
    if (info.phase !== 'account-mismatch' || !info.userId || !clientRef.current) return;
    // This is intentional: never upload another person's local data to this account.
    const userId = info.userId;
    window.localStorage.setItem(OWNER_KEY,userId);
    dbRef.current=DEFAULT_DB();
    setDb(DEFAULT_DB());
    activeRef.current={id:userId,email:info.email};
    initializedRef.current=true;
    setInfo(p=>({...p,phase:'syncing',error:''}));
    void syncRef.current();
  }
  function clearAccountBindingIfSignedOut() {
    if (info.userId) return;
    window.localStorage.removeItem(OWNER_KEY);
  }
  return {
    ...info, sendCode, verifyCode, signOut, signInWithGithub, linkGithub, replaceWithAccount,
    syncNow:()=>syncRef.current(), clearAccountBindingIfSignedOut
  };
}
