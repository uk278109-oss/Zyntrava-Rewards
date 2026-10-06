 "use client";
import {useEffect,useMemo,useState} from "react";
import {Howl} from "howler";
import {COLORS,HOME,PATH,Player,PlayerColor,Token,canMove,chooseAiMove,pathIndex,rollDice,step,winner} from "../lib/game";

const sounds:any={};
function sfx(name:string){
  try{
    const src=`/sounds/${name}.mp3`;
    sounds[name] ||= new Howl({src:[src],volume:.55});
    sounds[name].play();
  }catch{}
}
const initial:Player[]=[
 {color:"red",name:"YOU",tokens:[0,1,2,3].map(id=>({id,progress:0}))},
 {color:"green",name:"BIRYANI BOT",bot:true,difficulty:"Easy",tokens:[0,1,2,3].map(id=>({id,progress:0}))},
 {color:"yellow",name:"CHAI BOT",bot:true,difficulty:"Hard",tokens:[0,1,2,3].map(id=>({id,progress:0}))},
 {color:"blue",name:"PAAN BOT",bot:true,difficulty:"Desi",tokens:[0,1,2,3].map(id=>({id,progress:0}))},
];

function Board({players,onToken}:{players:Player[];onToken:(i:number,t:number)=>void}){
 const cells=useMemo(()=>PATH.map(([r,c],i)=>({r,c,i})),[]);
 const occ:any={};
 players.forEach((p,pi)=>p.tokens.forEach(t=>{
   const x=pathIndex(p.color,t.progress); if(x>=0)(occ[x]??=[]).push({pi,t});
 }));
 return <div className="board">
   <div className="zone red"><b>RED</b></div><div className="zone green"><b>GREEN</b></div>
   <div className="zone blue"><b>BLUE</b></div><div className="zone yellow"><b>YELLOW</b></div>
   {cells.map(c=><div key={c.i} className="cell" style={{gridRow:c.r+1,gridColumn:c.c+1}}>
     {occ[c.i]?.map((o:any)=><button key={`${o.pi}-${o.t.id}`} className={`token ${players[o.pi].color}`} onClick={()=>onToken(o.pi,o.t.id)}>{o.t.id+1}</button>)}
   </div>)}
   <div className="center">LUDO<br/><span>PARTY</span></div>
 </div>
}

export default function Home(){
 const [screen,setScreen]=useState("home");
 const [players,setPlayers]=useState(initial);
 const [turn,setTurn]=useState(0);
 const [dice,setDice]=useState(0);
 const [rolling,setRolling]=useState(false);
 const [coins,setCoins]=useState(()=>Number(localStorage.getItem("lp-coins")||"1000"));
 const [msg,setMsg]=useState("Your turn — roll the dice");
 useEffect(()=>localStorage.setItem("lp-coins",String(coins)),[coins]);

 function reset(){setPlayers(initial.map(p=>({...p,tokens:p.tokens.map(t=>({...t}))})));setTurn(0);setDice(0);setMsg("Your turn — roll the dice");}
 function roll(){
   if(rolling||turn!==0)return;
   setRolling(true);sfx("dice-roll");
   setTimeout(()=>{const d=rollDice();setDice(d);setRolling(false);setMsg(d===6?"Six! Choose a token.":"Choose a highlighted token.");},450);
 }
 function move(pi:number,tid:number){
   if(pi!==turn||dice===0)return;
   const p=players[pi],t=p.tokens[tid];
   if(!canMove(t,dice))return;
   const np=players.map((x,i)=>i===pi?({...x,tokens:x.tokens.map((z,j)=>j===tid?step(z,dice):z)}):x);
   const moved=step(t,dice);
   if(moved.progress===57)sfx("win-yeeha");
   setPlayers(np);setDice(0);
   if(dice!==6)setTurn((turn+1)%4); else setMsg("Six! Roll again.");
 }
 useEffect(()=>{
   if(turn===0||dice!==0)return;
   const p=players[turn]; const d=rollDice(); setTimeout(()=>{
     setDice(d);sfx("dice-roll");
     const t=chooseAiMove(p,d,players.filter((_,i)=>i!==turn));
     if(t){setTimeout(()=>{const idx=p.tokens.findIndex(x=>x.id===t.id);const np=players.map((x,i)=>i===turn?({...x,tokens:x.tokens.map(z=>z.id===t.id?step(z,d):z)}):x);setPlayers(np);setDice(0);setTurn(d===6?turn:(turn+1)%4)},600)}
     else {setTimeout(()=>{setDice(0);setTurn((turn+1)%4)},450)}
   },700);
 },[turn,dice]);

 if(screen==="home")return <main className="app"><div className="hero"><div className="brand">LUDO <span>PARTY</span></div><p>DESI DHAMAKA • FUTURISTIC EDITION</p><button className="primary" onClick={()=>setScreen("game")}>PLAY OFFLINE</button><button className="secondary" onClick={()=>setScreen("modes")}>GAME MODES</button></div><div className="cards"><div><b>{coins}</b><small>COINS</small></div><div><b>LVL 1</b><small>PROFILE</small></div><div><b>PLUS</b><small>PREMIUM</small></div></div></main>;
 if(screen==="modes")return <main className="app"><section className="panel"><button className="back" onClick={()=>setScreen("home")}>← BACK</button><h1>GAME MODES</h1><div className="mode" onClick={()=>setScreen("game")}><b>SOLO VS BOTS</b><span>Biryani • Chai • Paan</span></div><div className="mode locked"><b>ONLINE ROOMS</b><span>Realtime multiplayer • coming next</span></div><div className="mode"><b>PASS & PLAY</b><span>4 players on one device</span></div></section></main>;
 return <main className="game"><header><button className="back" onClick={()=>{reset();setScreen("home")}}>←</button><div><b>LUDO PARTY</b><small>{msg}</small></div><div className="wallet">🪙 {coins}</div></header><div className="arena"><div className="players">{players.map((p,i)=><div className={`player ${p.color} ${turn===i?"active":""}`} key={p.color}><b>{p.name}</b><small>{winner(p)?"WINNER":i===turn?"TURN":"READY"}</small></div>)}</div><Board players={players} onToken={move}/><div className="controls"><div className={`dice ${rolling?"spin":""}`} onClick={roll}>{dice||"?"}</div><button className="primary roll" onClick={roll} disabled={turn!==0||rolling}>ROLL DICE</button><small>Need 6 to launch a token • Safe movement • Fair random dice</small></div></div></main>
}
