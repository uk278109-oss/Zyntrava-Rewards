export type Color = "red" | "yellow" | "green" | "blue";
export type Difficulty = "easy" | "hard" | "desi";
export type Mode = "solo" | "pair" | "local";
export type Power = "bomb" | "rocket" | "ghost";

export type Token = {
  id: number;
  pos: number;       // -1 yard, 0..51 track, 52..57 home lane
  finished: boolean;
  ghost: number;     // turns remaining
};

export type Player = {
  color: Color;
  name: string;
  bot: boolean;
  difficulty?: Difficulty;
  tokens: Token[];
  powerups: Power[];
};

export const COLORS: Color[] = ["red", "yellow", "green", "blue"];
export const START: Record<Color, number> = { red: 0, yellow: 13, green: 26, blue: 39 };
export const NAMES: Record<Color, string> = {
  red: "Red", yellow: "Yellow", green: "Green", blue: "Blue"
};
export const BOT_NAMES = ["Biryani Bot", "Chai Bot", "Paan Bot"];

export function makePlayers(mode: Mode, difficulty: Difficulty): Player[] {
  return COLORS.map((color, i) => ({
    color,
    name: mode === "solo" && i > 0 ? BOT_NAMES[i - 1] : NAMES[color],
    bot: mode === "solo" && i > 0,
    difficulty: mode === "solo" && i > 0 ? difficulty : undefined,
    tokens: [0, 1, 2, 3].map(id => ({ id, pos: -1, finished: false, ghost: 0 })),
    powerups: ["bomb", "rocket", "ghost"] as Power[]
  }));
}

export function rollDice() { return Math.floor(Math.random() * 6) + 1; }

export function canMove(t: Token, dice: number): boolean {
  if (t.finished) return false;
  if (t.pos === -1) return dice === 6;
  return t.pos + dice <= 57;
}

export function nextPos(t: Token, dice: number): number {
  if (t.pos === -1) return 0;
  return Math.min(57, t.pos + dice);
}

export function globalTrack(color: Color, pos: number): number | null {
  if (pos < 0 || pos > 51) return null;
  return (START[color] + pos) % 52;
}

export function sameSquare(a: Player, at: number, b: Player, bt: number) {
  const ga = globalTrack(a.color, at), gb = globalTrack(b.color, bt);
  return ga !== null && gb !== null && ga === gb;
}

function scoreMove(p: Player, token: Token, dice: number, players: Player[], power: Power | null) {
  const np = nextPos(token, dice);
  let score = np * 2;
  if (np === 57) score += 80;
  if (token.pos === -1 && dice === 6) score += 25;
  for (const o of players) if (o.color !== p.color) {
    for (const ot of o.tokens) {
      if (sameSquare(p, np, o, ot.pos)) score += ot.ghost > 0 ? 0 : 70;
    }
  }
  if (power === "rocket") score += 30;
  if (power === "bomb") score += 15;
  if (power === "ghost") score += 10;
  return score;
}

export function chooseBotMove(p: Player, dice: number, players: Player[]): number | null {
  const legal = p.tokens.map((t, i) => ({ t, i })).filter(x => canMove(x.t, dice));
  if (!legal.length) return null;
  if (p.difficulty === "easy") return legal[Math.floor(Math.random() * legal.length)].i;

  const scored = legal.map(x => ({ ...x, s: scoreMove(p, x.t, dice, players, null) }));
  scored.sort((a, b) => b.s - a.s);
  if (p.difficulty === "desi" && scored.length > 1 && Math.random() < .2) {
    return scored[Math.floor(Math.random() * Math.min(2, scored.length))].i;
  }
  if (p.difficulty === "hard" && Math.random() < .12) {
    return legal[Math.floor(Math.random() * legal.length)].i;
  }
  return scored[0].i;
}

export function reactionFor(event: "roll"|"kill"|"win"|"oops"|"six"|"move") {
  const map = {
    roll: ["Oye hoye!", "Chalo ji!", "Dekho ab!"],
    kill: ["OUCH!", "HAHA!", "OOPS!"],
    win: ["YEEHA!", "Shabash!", "Wah!"],
    oops: ["OOPS!", "Aray yaar!", "Kya ho gaya!"],
    six: ["HAHA! SIX!", "Wah six!", "Chalo bhai!"],
    move: ["Nice!", "Wah!", "Shabash!"]
  };
  const a = map[event];
  return a[Math.floor(Math.random() * a.length)];
}

export function applyMove(players: Player[], pi: number, ti: number, dice: number) {
  const ps = players.map(p => ({ ...p, tokens: p.tokens.map(t => ({...t})), powerups: [...p.powerups] }));
  const p = ps[pi], t = p.tokens[ti];
  const np = nextPos(t, dice);
  t.pos = np;
  t.finished = np === 57;
  let killed = false;

  if (np >= 0 && np <= 51) {
    for (let oi = 0; oi < ps.length; oi++) if (oi !== pi) {
      for (const ot of ps[oi].tokens) {
        if (ot.pos >= 0 && ot.pos <= 51 && sameSquare(p, np, ps[oi], ot.pos) && ot.ghost === 0) {
          ot.pos = -1;
          killed = true;
        }
      }
    }
  }
  for (const q of ps) for (const x of q.tokens) if (x.ghost > 0) x.ghost--;
  return { players: ps, killed };
}

export function usePower(players: Player[], pi: number, ti: number, power: Power) {
  const ps = players.map(p => ({ ...p, tokens: p.tokens.map(t => ({...t})), powerups: [...p.powerups] }));
  const p = ps[pi], t = p.tokens[ti];
  const idx = p.powerups.indexOf(power);
  if (idx < 0) return { players: ps, message: "Power-up unavailable" };
  p.powerups.splice(idx, 1);

  if (power === "rocket") {
    t.pos = Math.min(57, t.pos < 0 ? 12 : t.pos + 12);
    t.finished = t.pos === 57;
    return { players: ps, message: "🚀 Rocket! 12 steps!" };
  }
  if (power === "ghost") {
    t.ghost = 1;
    return { players: ps, message: "👻 Ghost mode for one turn!" };
  }
  // Bomb hits opponents on the same/adjacent track squares.
  if (t.pos >= 0 && t.pos <= 51) {
    const g = globalTrack(p.color, t.pos)!;
    for (let oi = 0; oi < ps.length; oi++) if (oi !== pi) {
      for (const ot of ps[oi].tokens) {
        const og = globalTrack(ps[oi].color, ot.pos);
        if (og !== null && Math.min((og-g+52)%52, (g-og+52)%52) <= 2 && ot.ghost === 0) ot.pos = -1;
      }
    }
  }
  return { players: ps, message: "💣 BOOM! Nearby opponents blasted!" };
}

export function winner(p: Player) { return p.tokens.every(t => t.finished); }

export function saveProfile(profile: unknown) {
  if (typeof window !== "undefined") localStorage.setItem("ludo-party-profile", JSON.stringify(profile));
}
export function loadProfile<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem("ludo-party-profile") || "") as T; } catch { return fallback; }
}
