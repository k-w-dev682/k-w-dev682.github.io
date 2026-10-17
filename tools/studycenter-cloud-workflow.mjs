// Add PUBLIC GitHub Actions variables to withastro/action without replacing the workflow.
import fs from 'node:fs';
import path from 'node:path';
const project=path.resolve(process.argv[2]||process.cwd());
const file=path.join(project,'.github/workflows/deploy.yml');
if(!fs.existsSync(file)){console.log('GitHub Actions workflow not found: configure env manually.');process.exit(0);}
let src=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
if(src.includes('vars.PUBLIC_SUPABASE_URL') && src.includes('vars.PUBLIC_SUPABASE_PUBLISHABLE_KEY')){
 console.log('GitHub Actions cloud variables already configured.');process.exit(0);
}
const lines=src.split('\n');
const ix=lines.findIndex(line=>/^\s*uses:\s*withastro\/action@/.test(line));
if(ix<0){console.log('No withastro/action step detected: add env manually (README).');process.exit(0);}
const indent=lines[ix].match(/^(\s*)/)[1];
let envLine=ix+1;
while(envLine<lines.length && /^\s*$/.test(lines[envLine]))envLine++;
const needs= [
  `${indent}  PUBLIC_SUPABASE_URL: \${{ vars.PUBLIC_SUPABASE_URL }}`,
  `${indent}  PUBLIC_SUPABASE_PUBLISHABLE_KEY: \${{ vars.PUBLIC_SUPABASE_PUBLISHABLE_KEY }}`
];
if(new RegExp(`^${indent.replace(/ /g,' ')}env:\\s*$`).test(lines[envLine]||'')){
  const end=envLine+1;
  lines.splice(end,0,...needs);
}else{
  lines.splice(ix+1,0,`${indent}env:`,...needs);
}
fs.writeFileSync(file,lines.join('\n'),'utf8');
console.log('Configured GitHub Actions public Supabase variables in deploy.yml.');
