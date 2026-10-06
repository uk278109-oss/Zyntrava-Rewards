"use client";
import {useEffect,useState} from "react";
import {Howl} from "howler";
import {rollDice,canMove,step,pathIndex,PATH,Player,chooseAiMove,winner} from "../lib/game";

type Screen="home"|"modes"|"setup"|"game"|"result"|"profile"|"shop"|"settings";
const audioCache:Record<string,Howl>={};
let bgm:Howl|undefined;
function sfx(name:string){try{if(typeof window==="undefined")return;if(!audioCache[name])audioCache[name]=new Howl({src:[`/sounds/${name}.mp3`],volume:.5});audioCache[name].play()}catch{}}
function startBgm(){try{if(typeof window==="undefined")return;if(!bgm)bgm=new Howl({src:["/sounds/bgm.mp3"],volume:.18,loop:true});if(!bgm.playing())bgm.play()}catch{}}
const makePlayers=():Player[]=>[
{color:"red",name:"YOU",tokens:[0,1,2,3].map(id=>({id,progress:0}))},
{color:"green",name:"BIRYANI BOT",bot:true,difficulty:"Easy",tokens:[0,1,2,3].map(id=>({id,progress:0}))},
{color:"yellow",name:"CHAI BOT",bot:true,difficulty:"Hard",tokens:[0,1,2,3].map(id=>({id,progress:0}))},
{color:"blue",name:"PAAN BOT",bot:true,difficulty:"Desi",tokens:[0,1,2,3].map(id=>({id,progress:0}))}];

function Board({players,onToken,active}:{players:Player[];onToken:(p:number,t:number)=>void;active:boolean}){
 const occ:Record<number,any[]>={};
 players.forEach((p,pi)=>p.tokens.forEach(t=>{const x=pathIndex(p.color,t.progress);if(x>=0)(occ[x]??=[]).push({pi,t})}));
 return <div className="board">
  <div className="zone red">RED<div className="homeTokens"><i/><i/><i/><i/></div></div>
  <div className="zone green">GREEN<div className="homeTokens"><i/><i/><i/><i/></div></div>
  <div className="zone blue">BLUE<div className="homeTokens"><i/><i/><i/><i/></div></div>
  <div className="zone yellow">YELLOW<div className="homeTokens"><i/><i/><i/><i/></div></div>
  {PATH.map(([r,c],i)=><div key={i} className="cell" style={{gridRow:r+1,gridColumn:c+1}}>{occ[i]?.map(o=><button type="button" key={o.pi+"-"+o.t.id} className={'token '+players[o.pi].color} disabled={!active} onClick={()=>onToken(o.pi,o.t.id)}>{o.t.id+1}</button>)}</div>)}
  <div className="center">LUDO<br/><b>PARTY</b></div>
 </div>
}
function Top({title,back,right}:{title:string;back:()=>void;right?:React.ReactNode}){return <header className="top"><button onClick={back}>←</button><b>{title}</b><span>{right}</span></header>}

export default function Page(){
 const [loading,setLoading]=useState(true);
 const [screen,setScreen]=useState<Screen>("home");
 const [players,setPlayers]=useState<Player[]>(makePlayers);const [turn,setTurn]=useState(0);const [dice,setDice]=useState(0);const [rolling,setRolling]=useState(false);const [msg,setMsg]=useState("Your turn — roll the dice");
 const [coins,setCoins]=useState(1000);const [games,setGames]=useState(12);const [wins,setWins]=useState(6);const [sound,setSound]=useState(true);
 useEffect(()=>{const t=setTimeout(()=>setLoading(false),1800);return()=>clearTimeout(t)},[]);
 useEffect(()=>{if(typeof window!=="undefined"){setCoins(Number(localStorage.getItem("lp-coins")||1000));setGames(Number(localStorage.getItem("lp-games")||12));setWins(Number(localStorage.getItem("lp-wins")||6));}},[]);
 useEffect(()=>{if(typeof window!=="undefined"){localStorage.setItem("lp-coins",String(coins));localStorage.setItem("lp-games",String(games));localStorage.setItem("lp-wins",String(wins));}},[coins,games,wins]);
 const start=()=>{startBgm();if(sound)sfx("button");setPlayers(makePlayers());setTurn(0);setDice(0);setMsg("Your turn — roll the dice");setScreen("game")};
 const roll=()=>{if(turn!==0||rolling||dice)return;startBgm();if(sound)sfx("dice-roll");setRolling(true);setTimeout(()=>{const d=rollDice();setDice(d);setRolling(false);if(sound&&d===6)sfx("six")},400)};
 const move=(pi:number,id:number)=>{if(pi!==turn||!dice)return;if(sound)sfx("token-move");const p=players[pi],t=p.tokens.find(x=>x.id===id);if(!t||!canMove(t,dice))return;const n=players.map((x,i)=>i===pi?({...x,tokens:x.tokens.map(z=>z.id===id?step(z,dice):z)}):x);setPlayers(n);const d=dice;setDice(0);if(winner(n[pi])){setGames(g=>g+1);if(pi===0){setWins(w=>w+1);setCoins(c=>c+250)}setScreen("result");setMsg(pi===0?"YOU WIN!":n[pi].name+" WINS!");return}if(d!==6){const nt=(turn+1)%4;setTurn(nt);setMsg(n[nt].name+"'s turn")}else setMsg("Six! Roll again.")};
 useEffect(()=>{if(screen!=="game"||turn===0||dice)return;const timer=setTimeout(()=>{const d=rollDice();setDice(d);const p=players[turn],t=chooseAiMove(p,d,players.filter((_,i)=>i!==turn));setTimeout(()=>{if(t){const n=players.map((x,i)=>i===turn?({...x,tokens:x.tokens.map(z=>z.id===t.id?step(z,d):z)}):x);setPlayers(n);setDice(0);if(winner(n[turn])){setScreen("result");setMsg(n[turn].name+" WINS!");return}}else setDice(0);if(d!==6){const nt=(turn+1)%4;setTurn(nt);setMsg(players[nt].name+"'s turn")}},500)},650);return()=>clearTimeout(timer)},[screen,turn,dice,players]);
 if(loading)return <main className="loadingScreen"><div className="loadingLogo">LUDO<strong>PARTY</strong></div><div className="loadingRing"><span/></div><p>LOADING GAME</p><div className="loadingBar"><i/></div><small>DESI DHAMAKA • FUTURISTIC EDITION</small></main>;
 if(screen==="home")return <main className="screen home"><div className="logo">LUDO<strong>PARTY</strong></div><p>DESI DHAMAKA <span>•</span> FUTURISTIC EDITION</p><button className="primary" onClick={()=>{startBgm();sfx("button");setScreen("modes")}}>PLAY OFFLINE</button><button className="secondary" onClick={()=>{sfx("button");setScreen("modes")}}>GAME MODES</button><div className="stats"><button onClick={()=>setScreen("profile")}><b>{coins}</b><small>COINS</small></button><button onClick={()=>setScreen("profile")}><b>LVL 1</b><small>PROFILE</small></button><button onClick={()=>setScreen("shop")}><b>PLUS</b><small>PREMIUM</small></button></div><button className="gear" onClick={()=>setScreen("settings")}>⚙</button></main>;
 if(screen==="modes")return <main className="screen"><Top title="GAME MODES" back={()=>setScreen("home")}/><section className="content"><div className="card active" onClick={()=>setScreen("setup")}><b>SOLO VS BOTS</b><small>Biryani • Chai • Paan</small><em>PLAY</em></div><div className="card" onClick={()=>setScreen("setup")}><b>PASS & PLAY</b><small>4 players on one device</small><em>PLAY</em></div><div className="card locked"><b>ONLINE ROOMS</b><small>Realtime multiplayer • coming next</small><em>SOON</em></div></section></main>;
 if(screen==="setup")return <main className="screen"><Top title="MATCH SETUP" back={()=>setScreen("modes")}/><section className="content centerText"><h1>SOLO BATTLE</h1><p>Choose your challenge and start the match.</p><div className="bots">{players.map((p,i)=><div key={p.color} className={'bot '+p.color}><div>{p.name.slice(0,1)}</div><b>{p.name}</b><small>{i===0?"YOU":p.difficulty}</small></div>)}</div><button className="primary" onClick={start}>START MATCH</button></section></main>;
 if(screen==="game")return <main className="game"><Top title="LUDO PARTY" back={()=>setScreen("home")} right={coins}/><div className="message">{msg}</div><div className="players">{players.map((p,i)=><div className={'player '+p.color+(turn===i?' active':'')} key={p.color}><b>{p.name}</b><small>{turn===i?'TURN':'READY'}</small></div>)}</div><Board players={players} onToken={move} active={turn===0&&dice>0}/><div className="diceWrap"><button className={'dice '+(rolling?'spin':'')} onClick={roll} disabled={turn!==0||rolling||!!dice}>{dice||"?"}</button><button className="primary roll" onClick={roll} disabled={turn!==0||rolling||!!dice}>ROLL DICE</button><small>Need 6 to launch • Safe movement • Fair random dice</small></div></main>;
 if(screen==="result")return <main className="screen result"><div className="resultCard"><div className="star">★</div><h1>{msg}</h1><p>Reward earned</p><strong>+250 COINS</strong><button className="primary" onClick={start}>PLAY AGAIN</button><button className="secondary" onClick={()=>setScreen("home")}>MAIN MENU</button></div></main>;
 if(screen==="profile")return <main className="screen"><Top title="PROFILE" back={()=>setScreen("home")}/><section className="content"><div className="profile"><div className="avatar">P</div><div><h2>PLAYER</h2><small>LEVEL 1</small><div className="bar"><i/></div></div></div><div className="statgrid"><div><b>{games}</b><small>GAMES</small></div><div><b>{wins}</b><small>WINS</small></div><div><b>{games?Math.round(wins/games*100):0}%</b><small>WIN RATE</small></div></div><h3>ACHIEVEMENTS</h3><div className="ach"><div>FIRST WIN</div><div>SIX MASTER</div><div>STREAK</div><div>100 TOKENS</div></div></section></main>;
 if(screen==="shop")return <main className="screen"><Top title="SHOP • PLUS" back={()=>setScreen("home")} right={coins}/><section className="content"><div className="plus"><b>PLUS</b><h1>LUDO PARTY PLUS</h1><p>More style. More features. Never pay to win.</p></div>{["PREMIUM SKINS","PREMIUM REACTIONS","DESI AI","VICTORY EFFECTS"].map(x=><div className="shop" key={x}><div><b>{x}</b><small>Unlock premium content</small></div><button>UNLOCK</button></div>)}<p className="note">Premium never gives stronger dice or guaranteed wins.</p></section></main>;
 return <main className="screen"><Top title="SETTINGS" back={()=>setScreen("home")}/><section className="content"><div className="setting"><span>SOUND EFFECTS</span><button className={sound?'on':''} onClick={()=>setSound(v=>!v)}><i/></button></div><div className="setting"><span>VIBRATION</span><button className="on"><i/></button></div><div className="setting"><span>OFFLINE SAVE</span><b>ON DEVICE</b></div><div className="setting"><span>LANGUAGE</span><b>ENGLISH</b></div></section></main>;
}
