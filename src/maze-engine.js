const key=([r,c])=>`${r},${c}`;

export function findMazePath(open,size,start,goal){
 const queue=[start],parents=new Map([[key(start),null]]),dirs=[[1,0],[-1,0],[0,1],[0,-1]];
 for(let i=0;i<queue.length;i++){const here=queue[i];if(key(here)===key(goal))break;for(const [dr,dc] of dirs){const next=[here[0]+dr,here[1]+dc],k=key(next);if(next[0]>=0&&next[0]<size&&next[1]>=0&&next[1]<size&&open.has(k)&&!parents.has(k)){parents.set(k,here);queue.push(next);}}}
 if(!parents.has(key(goal)))return [];
 const path=[];for(let at=goal;at;at=parents.get(key(at)))path.push(at);return path.reverse();
}

export function makeTraceMaze(size=11,random=Math.random){
 size=Math.max(7,Math.min(15,size|1));if(size%2===0)size+=1;
 const start=[1,1],open=new Set([key(start)]),visited=new Set([key(start)]),stack=[start],dirs=[[2,0],[-2,0],[0,2],[0,-2]];
 while(stack.length){const [r,c]=stack[stack.length-1],choices=dirs.map(x=>x).sort(()=>random()-.5).filter(([dr,dc])=>{const nr=r+dr,nc=c+dc;return nr>0&&nr<size-1&&nc>0&&nc<size-1&&!visited.has(`${nr},${nc}`)});if(!choices.length){stack.pop();continue;}const [dr,dc]=choices[0],next=[r+dr,c+dc];open.add(`${r+dr/2},${c+dc/2}`);open.add(key(next));visited.add(key(next));stack.push(next);}
 let goal=start,best=-1;for(const cell of open){const [r,c]=cell.split(',').map(Number),distance=r+c;if(distance>best){best=distance;goal=[r,c];}}
 return {size,open,start,goal,solution:findMazePath(open,size,start,goal)};
}
