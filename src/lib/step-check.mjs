/* Restrained, non-eval expression sampling. This is a heuristic, NOT a symbolic proof.
 * Grammar: numbers, variables x/y, +,-,*,/,^, parentheses, sqrt(), abs().
 * Comparisons are only for pairs of explicit mathematical expressions (not equations).
 */
const tokenPattern=/\s*(sqrt|abs|[xy]|(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?|[()+\-*/^])\s*/giy;
function tokenize(expression){
 const str=String(expression).replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/\b([0-9]+),([0-9]+)\b/g,'$1.$2').trim();
 if(!str || str.length>180 || /[<>{};=\[\]!?:]|\\/.test(str))return null;
 const tokens=[];let pos=0; tokenPattern.lastIndex=0;
 while(pos<str.length){tokenPattern.lastIndex=pos;const m=tokenPattern.exec(str);if(!m || m.index!==pos)return null;tokens.push(m[1]);pos=tokenPattern.lastIndex;if(tokens.length>90)return null;}
 return tokens;
}
export function compileExpression(expression){
 const ts=tokenize(expression);if(!ts)return null;
 let i=0;let nodes=0;
 const peek=()=>ts[i];const eat=x=>peek()===x?(i++,true):false;
 function primary(){
  if(++nodes>120)throw Error('Too many nodes');
  if(eat('(')){const child=sum();if(!eat(')'))throw Error('Unclosed bracket');return child;}
  if(peek()==='sqrt'||peek()==='abs'){const fn=ts[i++];if(!eat('('))throw Error('Missing bracket');const child=sum();if(!eat(')'))throw Error('Unclosed function');return {fn,child};}
  const tok=ts[i++];if(tok==='x'||tok==='y')return {variable:tok};
  if(tok!==undefined && /^(?:\d|\.)/.test(tok) && Number.isFinite(Number(tok)))return {number:Number(tok)};
  throw Error('Invalid expression');
 }
 function power(){let l=primary();if(eat('^')){const r=unary();l={op:'^',l,r};}return l;}
 function unary(){if(eat('+'))return unary();if(eat('-'))return {op:'neg',child:unary()};return power();}
 function product(){let l=unary();while(peek()==='*'||peek()==='/'){const op=ts[i++];l={op,l,r:unary()};}return l;}
 function sum(){let l=product();while(peek()==='+'||peek()==='-'){const op=ts[i++];l={op,l,r:product()};}return l;}
 try{const result=sum();return i===ts.length?result:null;}catch{return null;}
}
export function calculate(ast,scope={x:1,y:2},depth=0){
 if(!ast||depth>120)return NaN;
 if('number'in ast)return ast.number;
 if('variable'in ast)return scope[ast.variable];
 if(ast.fn){const v=calculate(ast.child,scope,depth+1);return ast.fn==='sqrt'?Math.sqrt(v):Math.abs(v);}
 if(ast.op==='neg')return -calculate(ast.child,scope,depth+1);
 const a=calculate(ast.l,scope,depth+1),b=calculate(ast.r,scope,depth+1);
 switch(ast.op){case '+':return a+b;case '-':return a-b;case '*':return a*b;case '/':return a/b;case '^':return Math.abs(b)>12?NaN:Math.pow(a,b);default:return NaN;}
}
export function compareExpressions(left,right){
 const a=compileExpression(left),b=compileExpression(right);
 if(!a||!b)return {status:'unsupported',label:'Sprawdzenie automatyczne nie obsługuje tego zapisu — użyj oceny Gemini.'};
 const samples=[[-5,1],[-2,3],[-0.4,-3],[0,2],[0.5,-1],[1,0.7],[2,4],[4.5,-2],[8,5],[10,1.2]];
 let count=0;
 for(const [x,y] of samples){
  const u=calculate(a,{x,y}),v=calculate(b,{x,y});
  if(!Number.isFinite(u)||!Number.isFinite(v))continue;
  count++;
  if(Math.abs(u-v)>1e-7*Math.max(1,Math.abs(u),Math.abs(v)))return {status:'mismatch',label:`Niezgodność przy x=${x}, y=${y}: ${Number(u.toPrecision(6))} ≠ ${Number(v.toPrecision(6))}.`};
 }
 if(count<4)return {status:'inconclusive',label:'Za mało punktów, w których oba wyrażenia mają określoną wartość.'};
 return {status:'sampled',label:`Wyniki zgodne dla ${count} przykładowych podstawień. To NIE jest dowód równoważności; sprawdź dziedzinę i każdy krok.`};
}
export function checkLineSequence(lines){
 const clean=String(lines||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,24);
 return clean.slice(1).map((line,index)=>({...compareExpressions(clean[index],line),from:index+1,to:index+2}));
}
