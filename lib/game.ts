export type PlayerColor = "red"|"green"|"yellow"|"blue";
export type Token = {id:number; progress:number};
export type Player = {color:PlayerColor; name:string; bot?:boolean; difficulty?:string; tokens:Token[]};

export const COLORS:PlayerColor[]=["red","green","yellow","blue"];
export const PATH=[
 [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
 [0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
 [7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
 [14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],
];
export const START:{[K in PlayerColor]:number}={red:0,green:13,yellow:26,blue:39};
export const HOME={red:[1,1],green:[1,10],yellow:[10,10],blue:[10,1]};

export function rollDice(){return Math.floor(Math.random()*6)+1}
export function canMove(t:Token,d:number){return t.progress===0 ? d===6 : t.progress+d<=57}
export function step(t:Token,d:number):Token{
  if(t.progress===0 && d===6) return {...t,progress:1};
  return {...t,progress:t.progress+d};
}
export function pathIndex(color:PlayerColor,progress:number){
  if(progress<=0 || progress>52)return -1;
  return (START[color]+progress-1)%52;
}
export function winner(p:Player){return p.tokens.every(t=>t.progress===57)}
export function chooseAiMove(p:Player,d:number,opponents:Player[]){
  const legal=p.tokens.filter(t=>canMove(t,d));
  if(!legal.length)return null;
  const score=(t:Token)=>{
    const finish=t.progress+d===57?1000:0;
    const advance=t.progress*4;
    return finish+advance+(Math.random()*30);
  };
  return [...legal].sort((a,b)=>score(b)-score(a))[0];
}
