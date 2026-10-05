"use client";

import { useEffect, useMemo, useState } from "react";
import { Howl } from "howler";
import {
  applyMove, COLORS, Difficulty, loadProfile, makePlayers, Mode, Player,
  Power, reactionFor, rollDice, usePower, winner, canMove
} from "../lib/game";

type Profile = {
  coins: number; xp: number; wins: number; games: number; kills: number;
  sixes: number; streak: number; premium: boolean;
};

const defaultProfile: Profile = {
  coins: 500, xp: 0, wins: 0, games: 0, kills: 0, sixes: 0, streak: 0, premium: false
};

const sound = (file: string) => {
  try { new Howl({ src: [file], volume: .65 }).play(); } catch {}
};

const emojis: Record<string,string> = { red:"🐶", yellow:"🐱", green:"🐸", blue:"🐼" };

export default function Home() {
  const [mode, setMode] = useState<Mode>("solo");
  const [difficulty, setDifficulty] = useState<Difficulty>("desi");
  const [players, setPlayers] = useState<Player[]>(() => makePlayers("solo", "desi"));
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState("Roll the dice!");
  const [reaction, setReaction] = useState("LET'S GO!");
  const [started, setStarted] = useState(false);
  const [selected, setSelected] = useState(0);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setProfile(loadProfile(defaultProfile));
  }, []);

  useEffect(() => {
    localStorage.setItem("ludo-party-profile", JSON.stringify(profile));
  }, [profile]);

  const current = players[turn];
  const legal = useMemo(
    () => dice ? current.tokens.map(t => canMove(t, dice)) : [false,false,false,false],
    [dice, current]
  );

  function newGame(m = mode, d = difficulty) {
    const ps = makePlayers(m, d);
    setPlayers(ps); setTurn(0); setDice(null); setStarted(true); setSelected(0);
    setMessage("New game started!"); setReaction("LET'S GO!");
    setProfile(p => ({...p, games: p.games + 1}));
  }

  function nextTurn(extra = false) {
    if (extra) {
      setDice(null);
      setMessage("SIX! Roll again 😎");
      setReaction(reactionFor("six"));
      return;
    }
    setDice(null);
    setTurn(t => (t + 1) % 4);
  }

  function doRoll() {
    if (!started || rolling || dice !== null || current.bot) return;
    setRolling(true); sound("/sounds/dice-roll.mp3");
    window.setTimeout(() => {
      const d = rollDice();
      setDice(d); setRolling(false);
      setReaction(d === 6 ? reactionFor("six") : reactionFor("roll"));
      if (d === 6) setProfile(p => ({...p, sixes:p.sixes+1}));
      if (!players[turn].tokens.some(t => canMove(t,d))) {
        setMessage("No legal move — OOPS!");
        setReaction(reactionFor("oops"));
        window.setTimeout(() => nextTurn(false), 700);
      } else setMessage(`You rolled ${d}. Pick a token.`);
    }, 550);
  }

  function moveToken(ti: number) {
    if (dice === null || !legal[ti] || current.bot) return;
    const result = applyMove(players, turn, ti, dice);
    setPlayers(result.players);
    sound(result.killed ? "/sounds/kill-ouch.mp3" : "/sounds/oops.mp3");
    if (result.killed) {
      setReaction(reactionFor("kill"));
      setProfile(p => ({...p, kills:p.kills+1, coins:p.coins+30, xp:p.xp+20}));
    } else setReaction(reactionFor("move"));
    const win = winner(result.players[turn]);
    if (win) {
      sound("/sounds/win-yeeha.mp3");
      setReaction(reactionFor("win")); setMessage(`${current.name} WINS! 🏆`);
      setProfile(p => ({...p, wins:p.wins+1, streak:p.streak+1, coins:p.coins+150, xp:p.xp+100}));
      setDice(null); return;
    }
    nextTurn(dice === 6);
  }

  function activatePower(power: Power) {
    if (dice === null || current.bot) return;
    const result = usePower(players, turn, selected, power);
    setPlayers(result.players); setMessage(result.message); setReaction(power === "bomb" ? "BOOM!" : "NICE!");
    setDice(null);
    nextTurn(false);
  }

  // Simple visual board: 52 track cells in a loop, plus home/yard corners.
  const track = Array.from({length:52},(_,i)=>i);

  // Bot turn
  useEffect(() => {
    if (!started || !current.bot) return;
    const timer = window.setTimeout(() => {
      const d = rollDice();
      setDice(d); setReaction(d===6 ? reactionFor("six") : reactionFor("roll"));
      setMessage(`${current.name} rolled ${d}`);
      const legalIndexes = current.tokens.map((t,i)=>canMove(t,d)?i:-1).filter(i=>i>=0);
      if (!legalIndexes.length) {
        window.setTimeout(() => nextTurn(false), 600);
        return;
      }
      let best = legalIndexes[0];
      if (current.difficulty === "easy") best = legalIndexes[Math.floor(Math.random()*legalIndexes.length)];
      else {
        // AI uses the same engine's scoring indirectly by favoring finish/forward/kill.
        best = legalIndexes.sort((a,b) => {
          const ta=current.tokens[a], tb=current.tokens[b];
          return (tb.pos + (tb.pos===-1?10:0)) - (ta.pos + (ta.pos===-1?10:0));
        })[0];
      }
      window.setTimeout(() => {
        const result = applyMove(players, turn, best, d);
        setPlayers(result.players);
        if (result.killed) {
          setReaction(reactionFor("kill")); setProfile(p=>({...p,kills:p.kills+1}));
        }
        if (winner(result.players[turn])) {
          setReaction(reactionFor("win")); setMessage(`${current.name} wins!`);
          setProfile(p=>({...p, coins:p.coins+100, xp:p.xp+100}));
          return;
        }
        nextTurn(d===6);
      }, 600);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [started, current.bot, turn, dice]);

  if (!started) return (
    <main className="menu">
      <section className="hero">
        <div className="logo">🎲 LUDO PARTY</div>
        <h1>DESI <span>DHAMAKA</span></h1>
        <p>Modern. Funny. Offline. Full-on Ludo madness.</p>
        <div className="cards">
          <button className="modeCard active" onClick={()=>{setMode("solo");newGame("solo",difficulty)}}>🤖<b>Single Player</b><small>3 crazy bots</small></button>
          <button className="modeCard" onClick={()=>{setMode("pair");newGame("pair",difficulty)}}>🤝<b>Pair 2v2</b><small>Red + Yellow vs Blue + Green</small></button>
          <button className="modeCard" onClick={()=>{setMode("local");newGame("local",difficulty)}}>👨‍👩‍👧‍👦<b>4 Player</b><small>Pass & play</small></button>
        </div>
        <div className="difficulty">
          <b>AI Difficulty</b>
          {(["easy","hard","desi"] as Difficulty[]).map(d=><button key={d} className={difficulty===d?"selected":""} onClick={()=>setDifficulty(d)}>{d.toUpperCase()}</button>)}
        </div>
        <div className="premiumHint">⭐ Ludo Party Plus — premium-ready, never pay-to-win</div>
      </section>
    </main>
  );

  return (
    <main className="game">
      <header>
        <div><strong>🎲 LUDO PARTY</strong><span> DESI DHAMAKA</span></div>
        <div className="stats">🪙 {profile.coins} &nbsp; ⭐ XP {profile.xp} &nbsp; 🏆 {profile.wins}</div>
        <button className="iconBtn" onClick={()=>setMenu(!menu)}>☰</button>
      </header>

      {menu && <div className="drawer">
        <h2>Player Stats</h2><p>Games: {profile.games}</p><p>Kills: {profile.kills}</p><p>Sixes: {profile.sixes}</p><p>Win streak: {profile.streak}</p>
        <button onClick={()=>setProfile(p=>({...p,premium:!p.premium}))}>⭐ Premium Demo: {profile.premium?"ON":"OFF"}</button>
        <button onClick={()=>newGame()}>🔄 New Game</button>
      </div>}

      <section className="topbar">
        <div className={`turnBadge ${current.color}`}>{emojis[current.color]} {current.name}'s turn</div>
        <div className="bubble">{reaction}</div>
      </section>

      <section className="boardWrap">
        <div className="board">
          <div className="corner redCorner"><span>🔴</span>{players[0].tokens.map((t,i)=><TokenView key={i} t={t} color="red" yard />)}</div>
          <div className="corner yellowCorner"><span>🟡</span>{players[1].tokens.map((t,i)=><TokenView key={i} t={t} color="yellow" yard />)}</div>
          <div className="corner greenCorner"><span>🟢</span>{players[2].tokens.map((t,i)=><TokenView key={i} t={t} color="green" yard />)}</div>
          <div className="corner blueCorner"><span>🔵</span>{players[3].tokens.map((t,i)=><TokenView key={i} t={t} color="blue" yard />)}</div>
          <div className="track">
            {track.map(i => {
              const occupants: {p:Player,t:number}[] = [];
              players.forEach(p=>p.tokens.forEach((t,ti)=> {
                if (t.pos === i && t.pos >= 0 && t.pos <= 51) occupants.push({p,t:ti});
              }));
              return <div className="cell" key={i}>{occupants.map(o=><div key={o.p.color+o.t} className={`trackToken ${o.p.color}`}>{emojis[o.p.color]}</div>)}</div>
            })}
          </div>
          <div className="home">🏠<b>HOME</b><small>Finish all 4!</small></div>
        </div>
      </section>

      <section className="controls">
        <div className="diceArea">
          <button className={`dice ${rolling?"roll":""}`} onClick={doRoll} disabled={rolling || dice!==null || current.bot}>
            {rolling ? "🎲" : dice ?? "🎲"}
          </button>
          <small>{current.bot ? "Bot thinking…" : dice===null ? "ROLL DICE" : "SELECT TOKEN"}</small>
        </div>
        <div className="tokens">
          {current.tokens.map((t,i)=><button key={i} disabled={!legal[i] || current.bot} className={`tokenBtn ${current.color} ${legal[i]?"can":""}`} onClick={()=>{setSelected(i);moveToken(i)}}>{emojis[current.color]} {i+1}<small>{t.pos===-1?"YARD":t.finished?"HOME":`STEP ${t.pos}`}</small></button>)}
        </div>
        <div className="powers">
          {(["bomb","rocket","ghost"] as Power[]).map(p=><button key={p} onClick={()=>activatePower(p)} disabled={current.bot || dice===null || !current.powerups.includes(p) || current.tokens[selected].pos<0} className="power">{p==="bomb"?"💣":p==="rocket"?"🚀":"👻"} {p.toUpperCase()}</button>)}
        </div>
      </section>
      <footer><span>{message}</span><button onClick={()=>newGame()}>NEW GAME</button></footer>
    </main>
  );
}

function TokenView({t,color,yard}:{t:any,color:string,yard?:boolean}) {
  return <div className={`yardToken ${color} ${t.ghost?"ghost":""}`}>{emojis[color]}<small>{t.id+1}</small></div>;
}