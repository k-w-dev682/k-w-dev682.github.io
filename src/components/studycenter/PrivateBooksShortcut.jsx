import React,{useEffect,useState} from 'react';
import {privateBooksAccess} from '../../lib/studylab-private-books.mjs';
const BASE=(import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
export default function PrivateBooksShortcut(){
 const [allowed,setAllowed]=useState(false);
 useEffect(()=>{let alive=true;const check=()=>privateBooksAccess().then(r=>{if(alive)setAllowed(r.allowed);}).catch(()=>{if(alive)setAllowed(false);});void check();window.addEventListener('focus',check);window.addEventListener('studylab:account-changed',check);return()=>{alive=false;window.removeEventListener('focus',check);window.removeEventListener('studylab:account-changed',check);};},[]);
 return <div style={{margin:'8px 0 12px'}}>{allowed?
  <a className="sc-secondary" href={`${BASE}ksiazki/`} style={{display:'inline-flex',padding:'10px 16px',textDecoration:'none'}}>📚 Moja prywatna biblioteka i notatki ↗</a>:
  <p>Zaloguj się, aby dodać prywatne książki, PDF-y, notatki i kursy na swoje konto.</p>}</div>;
}
