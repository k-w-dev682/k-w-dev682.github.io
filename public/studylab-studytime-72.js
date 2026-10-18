/* Local-only, conservative activity estimate. Not a measure of learning or attention. */
(()=>{
 const KEY='studylab.studytime72.v1';let last=Date.now();
 const match=()=>{const path=location.pathname;return path.includes('/programowanie/')?'cpp':path.includes('/matematyka/matematyka-i/')?'math1':path.includes('/matematyka/matematyka-ii/')?'math2':path.includes('/ask/')?'ask':path.includes('/fizyka/')?'physics':path.includes('/elektronika/')?'electronics':null};
 for(const type of ['pointerdown','keydown','wheel','touchstart'])document.addEventListener(type,()=>{last=Date.now()},{passive:true});
 setInterval(()=>{const subj=match();if(!subj||document.hidden||Date.now()-last>90000)return;try{
  const data=JSON.parse(localStorage.getItem(KEY)||'{}');const day=new Date().toLocaleDateString('sv-SE');const key=day+'|'+subj;data[key]=(Number(data[key])||0)+15;
  const keys=Object.keys(data).sort();for(const k of keys.slice(0,Math.max(0,keys.length-450)))delete data[k];localStorage.setItem(KEY,JSON.stringify(data));
 }catch{}},15000);
})();
