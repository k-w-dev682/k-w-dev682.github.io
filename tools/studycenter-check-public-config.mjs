// Prevent accidentally publishing a secret/admin key in a browser build.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||process.cwd());
let key=(process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY||'').trim();
let url=(process.env.PUBLIC_SUPABASE_URL||'').trim();
for(const file of ['.env','.env.local']) {
 const loc=path.join(root,file);
 if(!fs.existsSync(loc))continue;
 for(const line of fs.readFileSync(loc,'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*(PUBLIC_SUPABASE_URL|PUBLIC_SUPABASE_PUBLISHABLE_KEY)\s*=\s*(.*)\s*$/);
  if(m){const val=m[2].trim().replace(/^['"]|['"]$/g,'');if(m[1]==='PUBLIC_SUPABASE_URL'&&!url)url=val;if(m[1]==='PUBLIC_SUPABASE_PUBLISHABLE_KEY'&&!key)key=val;}
 }
}
if(!url&&!key){console.log('StudyLab: Supabase disabled (offline mode).');process.exit(0);}
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)){
 throw new Error('StudyLab: PUBLIC_SUPABASE_URL must be your https://*.supabase.co project URL.');
}
if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)){
 throw new Error('StudyLab: use ONLY the sb_publishable_... key. NEVER use sb_secret_/service_role in PUBLIC_ variables.');
}
console.log('StudyLab: public Supabase configuration validated (no secret printed).');
