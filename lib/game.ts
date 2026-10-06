export type Color="red"|"yellow"|"green"|"blue";
export type Difficulty="easy"|"hard"|"desi"; export type Match="solo"|"pair"|"local"; export type Power="bomb"|"rocket"|"ghost";
export type Token={id:number;pos:number;ghost:number;done:boolean};
export type Player={color:Color;name:string;bot:boolean;team:number;difficulty?:Difficulty;tokens:Token[];powers:Power[]};
export const COLORS:Color[]=["red","yellow","green","blue"];
export const START:Record<Color,number>={red:0,yellow:13,green:26,blue:39};
export const BOT_NAMES=["Biryani Bot","Chai Bot","Paan Bot"];
export function createPlayers(match:Match,diff:Difficulty):Player[]{return COLORS.map((color,i)=>({color,name:match==="solo"&&i>0?BOT_NAMES[i-1]:color.toUpperCase(),bot:match==="solo"&&i>0,team:match==="pair"?(i<2?0:1):i,difficulty:match==="solo"&&i>0?diff:undefined,tokens:[0,1,2,3].map(id=>({id,pos:-1,ghost:0,done:false})),powers:["bomb","rocket","ghost"]}))}
export const roll=()=>1+Math.floor(Math.random()*6);
export function legal(t:Token,d:number){return !t.done&&(t.pos===-1?d===6:t.pos+d<=57)}
export function next(t:Token,d:number){return t.pos===-1?0:Math.min(57,t.pos+d)}
export function track(c:Color,p:number){return p>=0&&p<=51?(START[c]+p)%52:null}
export function same(a:Player,ap:number,b:Player,bp:number){const x=track(a.color,ap),y=track(b.color,bp);return x!==null&&y!==null&&x===y}
export function clone(ps:Player[]){return ps.map(p=>({...p,tokens:p.tokens.map(t=>({...t})),powers:[...p.powers]}))}
export function move(players:Player[],pi:number,ti:number,d:number){const ps=clone(players),p=ps[pi],t=p.tokens[ti];t.pos=next(t,d);t.done=t.pos===57;let kill=0;if(t.pos>=0&&t.pos<=51)for(let i=0;i<ps.length;i++)if(i!==pi)for(const ot of ps[i].tokens)if(ot.pos>=0&&ot.pos<=51&&same(p,t.pos,ps[i],ot.pos)&&ot.ghost===0){ot.pos=-1;kill++}for(const q of ps)for(const x of q.tokens)if(x.ghost>0)x.ghost--;return{players:ps,kill}}
export function usePower(players:Player[],pi:number,ti:number,power:Power){const ps=clone(players),p=ps[pi],t=p.tokens[ti],idx=p.powers.indexOf(power);if(idx<0)return{players:ps,text:"POWER UNAVAILABLE"};p.powers.splice(idx,1);if(power==="rocket"){t.pos=Math.min(57,t.pos<0?12:t.pos+12);t.done=t.pos===57;return{players:ps,text:"ROCKET BOOST • +12"}}if(power==="ghost"){t.ghost=1;return{players:ps,text:"GHOST SHIELD • 1 TURN"}}if(t.pos>=0&&t.pos<=51){const g=track(p.color,t.pos)!;for(let i=0;i<ps.length;i++)if(i!==pi)for(const ot of ps[i].tokens){const og=track(ps[i].color,ot.pos);if(og!==null&&Math.min((og-g+52)%52,(g-og+52)%52)<=2&&ot.ghost===0)ot.pos=-1}}return{players:ps,text:"BOMB BLAST • NEARBY TOKENS RESET"}}
export function won(p:Player){return p.tokens.every(t=>t.done)}
export function botChoice(p:Player,d:number,ps:Player[]){const ids=p.tokens.map((t,i)=>legal(t,d)?i:-1).filter(i=>i>=0);if(!ids.length)return null;if(p.difficulty==="easy")return ids[Math.floor(Math.random()*ids.length)];const score=(i:number)=>{const t=p.tokens[i],n=next(t,d);let s=n*2+(n===57?100:0)+(t.pos===-1?25:0);for(const o of ps)if(o.color!==p.color)for(const ot of o.tokens)if(same(p,n,o,ot.pos)&&ot.ghost===0)s+=80;return s};return ids.sort((a,b)=>score(b)-score(a))[0]}
