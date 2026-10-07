export type PlayerColor="red"|"green"|"yellow"|"blue";
export type Token={id:number;progress:number};
export type Player={color:PlayerColor;name:string;bot?:boolean;difficulty?:"Easy"|"Hard"|"Desi";tokens:Token[]};
export const COLORS:PlayerColor[]=["red","green","yellow","blue"];
export const START:Record<PlayerColor,number>={red:0,green:13,yellow:26,blue:39};
export const PATH:[number,number][]=[[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0]];
export const SAFE=[0,8,13,21,26,34,39,47];
export function rollDice(){return Math.floor(Math.random()*6)+1}
export function canMove(t:Token,d:number){return d>0&&(t.progress===0?d===6:t.progress+d<=57)}
export function step(t:Token,d:number):Token{return t.progress===0&&d===6?{...t,progress:1}:{...t,progress:Math.min(57,t.progress+d)}}
export function pathIndex(color:PlayerColor,progress:number){if(progress<1||progress>52)return -1;return(START[color]+progress-1)%52}
export function winner(p:Player){return p.tokens.every(t=>t.progress===57)}
export function chooseAiMove(p:Player,d:number){const legal=p.tokens.filter(t=>canMove(t,d));if(!legal.length)return null;return[...legal].sort((a,b)=>((b.progress+d===57?1000:0)+b.progress*5+Math.random()*50)-((a.progress+d===57?1000:0)+a.progress*5+Math.random()*50))[0]||null}
export function capture(players:Player[],mover:number,id:number){const t=players[mover].tokens.find(x=>x.id===id);if(!t)return{players,captured:false};const idx=pathIndex(players[mover].color,t.progress);if(idx<0||SAFE.includes(idx))return{players,captured:false};let captured=false;const next=players.map((p,pi)=>pi===mover?p:{...p,tokens:p.tokens.map(x=>{if(pathIndex(p.color,x.progress)===idx&&x.progress>0){captured=true;return{...x,progress:0}}return x})});return{players:next,captured}}
