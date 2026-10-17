// StudyLab: FSRS-5, jawna implementacja referencyjnych równań D/S/R.
// Źródło: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
// Parametry bazowe FSRS-5; bez uczenia indywidualnych wag, bez sieci i bez zależności npm.
// Krótkoterminowe kroki 1m/10m są regułą interfejsu, nie wyliczeniem interwału z modelu DSR.
export const FSRS_VERSION = 'FSRS-5';
export const FSRS_WEIGHTS = Object.freeze([0.40255,1.18385,3.173,15.69105,7.1949,0.5345,1.4604,0.0046,1.54575,0.1192,1.01925,1.9395,0.11,0.29605,2.26905,0.2315,2.9898,0.51655,0.6621]);
const DAY = 86_400_000;
const FACTOR = 19/81;
const cap = (v,a,b) => Math.max(a,Math.min(b,v));
const number = (v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const gradeOf = {again:1,hard:2,good:3,easy:4};
const w = FSRS_WEIGHTS;
export function initialDifficulty(grade){return cap(w[4]-Math.exp(w[5]*(grade-1))+1,1,10);}
export function retentionAt(stability,elapsedDays){return Math.pow(1+FACTOR*Math.max(0,elapsedDays)/Math.max(0.01,stability),-0.5);}
export function fsrsInterval(stability,retention=0.9){const r=cap(number(retention,0.9),0.7,0.97);return cap(Math.round(stability/FACTOR*(Math.pow(r,-2)-1)),1,36500);}
export function dueForCard(state){return Number(state?.due)||0;}
export function scheduleFSRS(previous,rating,now=Date.now(),target=0.9){
 const g=gradeOf[rating];if(!g)throw new Error('Nieznana ocena fiszki.');
 const prev=previous?.fsrs?.algorithm===FSRS_VERSION?previous.fsrs:null;
 const last=number(prev?.lastReview,0);
 const elapsedDays=prev?Math.max(0,(now-last)/DAY):0;
 let stability=prev?.stability||w[g-1];
 let difficulty=prev?.difficulty||initialDifficulty(g);
 let lapses=Number(prev?.lapses)||0;
 let repetitions=(Number(prev?.repetitions)||0)+1;
 if(prev){
  const R=retentionAt(stability,elapsedDays);
  const adjustment=(-w[6]*(g-3))*(10-difficulty)/9;
  difficulty=cap(w[7]*initialDifficulty(4)+(1-w[7])*(difficulty+adjustment),1,10);
  if(elapsedDays<1){
   // Wersja FSRS-5: aktualizacja stabilności dla powtórek tego samego dnia.
   stability=cap(stability*Math.exp(w[17]*(g-3+w[18])),0.1,36500);
  }else if(g===1){
   stability=cap(w[11]*Math.pow(difficulty,-w[12])*(Math.pow(stability+1,w[13])-1)*Math.exp(w[14]*(1-R)),0.1,36500);
  }else{
   const multiplier=g===2?w[15]:g===4?w[16]:1;
   const increase=Math.exp(w[8])*(11-difficulty)*Math.pow(stability,-w[9])*(Math.exp(w[10]*(1-R))-1)*multiplier;
   stability=cap(stability*(1+increase),0.1,36500);
  }
  if(g===1)lapses++;
 }else if(g===1){lapses=1;}
 // Steps na początku nauki i po zapomnieniu; dłuższe interwały z modelu FSRS.
 const interval=fsrsInterval(stability,target);
 const delay=g===1?60_000:g===2&&!prev?10*60_000:interval*DAY;
 const due=now+delay;
 return {
   ...(previous||{}),interval:g===1?0:g===2&&!prev?0:interval,due,last:now,
   fsrs:{algorithm:FSRS_VERSION,stability,difficulty,repetitions,lapses,
    elapsedDays,scheduledDays:g===1?0:g===2&&!prev?0:interval,lastReview:now,due,targetRetention:cap(number(target,0.9),0.7,0.97)}
 };
}
// Odtwórz rzeczywiste historyczne oceny z v1/v2 bez przepisywania dat.
// Nie migruj stanu SM-2 wprost: jego ease/interval nie są parametrami D/S modelu FSRS.
export function stateFromReviewHistory(reviews,cardId,now=Date.now(),target=0.9){
 const past=(Array.isArray(reviews)?reviews:[]).filter(r=>r.cardId===cardId && gradeOf[r.rating] && Number(r.date)>0 && Number(r.date)<=now).sort((a,b)=>a.date-b.date);
 let state=null;
 for(const review of past)state=scheduleFSRS(state,review.rating,Number(review.date),target);
 return state;
}
export function reviewFSRS(prev,history,cardId,rating,now=Date.now(),retention=0.9){
 if(prev?.fsrs?.algorithm===FSRS_VERSION)return scheduleFSRS(prev,rating,now,retention);
 const reconstructed=stateFromReviewHistory(history,cardId,now,retention);
 return scheduleFSRS(reconstructed,rating,now,retention);
}
