// Parabola x^2-4x on one monotonic branch; inversion only for y>=-4.
export const parabola = x => (x-2)*(x-2)-4;
export const inverseBranch = (y, branch='left') => {
 if (!Number.isFinite(y) || y < -4 || !['left','right'].includes(branch)) return null;
 return 2 + (branch==='left'?-1:1)*Math.sqrt(y+4);
};
export const domainForBranch = branch => branch==='left'?[-2,2]:[2,6];
export const parabolaPoints = (branch='left') => {
 const [start,end]=domainForBranch(branch);
 return Array.from({length:65},(_,i)=>{
  const x=start+(end-start)*i/64;
  return [x,parabola(x)];
 });
};
