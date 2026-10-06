"use client";

import { useEffect, useMemo, useState } from "react";
import { Howl } from "howler";
import {
  PATH,
  Player,
  canMove,
  chooseAiMove,
  pathIndex,
  rollDice,
  step,
  winner,
} from "../lib/game";

const sounds: Record<string, Howl> = {};

function sfx(name: string) {
  try {
    if (typeof window === "undefined") return;

    const src = `/sounds/${name}.mp3`;

    if (!sounds[name]) {
      sounds[name] = new Howl({
        src: [src],
        volume: 0.55,
      });
    }

    sounds[name].play();
  } catch {
    // Missing audio files should never crash the game.
  }
}

const initial: Player[] = [
  {
    color: "red",
    name: "YOU",
    tokens: [0, 1, 2, 3].map((id) => ({
      id,
      progress: 0,
    })),
  },
  {
    color: "green",
    name: "BIRYANI BOT",
    bot: true,
    difficulty: "Easy",
    tokens: [0, 1, 2, 3].map((id) => ({
      id,
      progress: 0,
    })),
  },
  {
    color: "yellow",
    name: "CHAI BOT",
    bot: true,
    difficulty: "Hard",
    tokens: [0, 1, 2, 3].map((id) => ({
      id,
      progress: 0,
    })),
  },
  {
    color: "blue",
    name: "PAAN BOT",
    bot: true,
    difficulty: "Desi",
    tokens: [0, 1, 2, 3].map((id) => ({
      id,
      progress: 0,
    })),
  },
];

type BoardProps = {
  players: Player[];
  onToken: (playerIndex: number, tokenId: number) => void;
};

function Board({ players, onToken }: BoardProps) {
  const cells = useMemo(
    () => PATH.map(([r, c], i) => ({ r, c, i })),
    []
  );

  const occupied: Record<
    number,
    Array<{ playerIndex: number; token: Player["tokens"][number] }>
  > = {};

  players.forEach((player, playerIndex) => {
    player.tokens.forEach((token) => {
      const index = pathIndex(player.color, token.progress);

      if (index >= 0) {
        if (!occupied[index]) {
          occupied[index] = [];
        }

        occupied[index].push({
          playerIndex,
          token,
        });
      }
    });
  });

  return (
    <div className="board">
      <div className="zone red">
        <b>RED</b>
      </div>

      <div className="zone green">
        <b>GREEN</b>
      </div>

      <div className="zone blue">
        <b>BLUE</b>
      </div>

      <div className="zone yellow">
        <b>YELLOW</b>
      </div>

      {cells.map((cell) => (
        <div
          key={cell.i}
          className="cell"
          style={{
            gridRow: cell.r + 1,
            gridColumn: cell.c + 1,
          }}
        >
          {occupied[cell.i]?.map((item) => (
            <button
              key={`${item.playerIndex}-${item.token.id}`}
              className={`token ${players[item.playerIndex].color}`}
              onClick={() =>
                onToken(item.playerIndex, item.token.id)
              }
              type="button"
            >
              {item.token.id + 1}
            </button>
          ))}
        </div>
      ))}

      <div className="center">
        LUDO
        <br />
        <span>PARTY</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState("home");

  const [players, setPlayers] = useState<Player[]>(initial);

  const [turn, setTurn] = useState(0);

  const [dice, setDice] = useState(0);

  const [rolling, setRolling] = useState(false);

  const [coins, setCoins] = useState(1000);

  const [msg, setMsg] = useState(
    "Your turn — roll the dice"
  );

  /*
   * IMPORTANT:
   * localStorage only runs in the browser.
   * This prevents:
   * "localStorage is not defined"
   * during Next.js prerender/build.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem("lp-coins");

    if (saved !== null) {
      setCoins(Number(saved) || 1000);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      "lp-coins",
      String(coins)
    );
  }, [coins]);

  function reset() {
    setPlayers(
      initial.map((player) => ({
        ...player,
        tokens: player.tokens.map((token) => ({
          ...token,
        })),
      }))
    );

    setTurn(0);
    setDice(0);
    setMsg("Your turn — roll the dice");
    setRolling(false);
  }

  function roll() {
    if (rolling || turn !== 0) return;

    setRolling(true);

    sfx("dice-roll");

    setTimeout(() => {
      const value = rollDice();

      setDice(value);
      setRolling(false);

      if (value === 6) {
        setMsg("Six! Choose a token.");
      } else {
        setMsg("Choose a highlighted token.");
      }
    }, 450);
  }

  function move(playerIndex: number, tokenId: number) {
    if (playerIndex !== turn || dice === 0) return;

    const player = players[playerIndex];

    const token = player.tokens[tokenId];

    if (!token) return;

    if (!canMove(token, dice)) return;

    const moved = step(token, dice);

    const nextPlayers = players.map((current, index) => {
      if (index !== playerIndex) {
        return current;
      }

      return {
        ...current,
        tokens: current.tokens.map((currentToken, index2) => {
          if (index2 !== tokenId) {
            return currentToken;
          }

          return moved;
        }),
      };
    });

    if (moved.progress === 57) {
      sfx("win-yeeha");
    }

    setPlayers(nextPlayers);
    setDice(0);

    if (winner(nextPlayers[playerIndex])) {
      setMsg(`${player.name} wins!`);

      if (playerIndex === 0) {
        setCoins((value) => value + 100);
      }

      return;
    }

    if (dice !== 6) {
      setTurn((turn + 1) % 4);
      setMsg(
        `${nextPlayers[(turn + 1) % 4].name}'s turn`
      );
    } else {
      setMsg("Six! Roll again.");
    }
  }

  /*
   * Simple offline AI.
   * Runs only for bot turns.
   */
  useEffect(() => {
    if (turn === 0) return;

    if (dice !== 0) return;

    const player = players[turn];

    const timer = setTimeout(() => {
      const value = rollDice();

      setDice(value);

      sfx("dice-roll");

      const selectedToken = chooseAiMove(
        player,
        value,
        players.filter((_, index) => index !== turn)
      );

      if (selectedToken) {
        const moveTimer = setTimeout(() => {
          const tokenIndex = player.tokens.findIndex(
            (token) => token.id === selectedToken.id
          );

          if (tokenIndex < 0) {
            setDice(0);
            setTurn((turn + 1) % 4);
            return;
          }

          const movedToken = step(
            selectedToken,
            value
          );

          const nextPlayers = players.map(
            (current, index) => {
              if (index !== turn) {
                return current;
              }

              return {
                ...current,
                tokens: current.tokens.map(
                  (token) =>
                    token.id === selectedToken.id
                      ? movedToken
                      : token
                ),
              };
            }
          );

          setPlayers(nextPlayers);
          setDice(0);

          if (movedToken.progress === 57) {
            sfx("win-yeeha");
          }

          if (winner(nextPlayers[turn])) {
            setMsg(`${player.name} wins!`);
            return;
          }

          if (value === 6) {
            setMsg(`${player.name} got a SIX!`);
          } else {
            const nextTurn = (turn + 1) % 4;

            setTurn(nextTurn);

            setMsg(
              `${nextPlayers[nextTurn].name}'s turn`
            );
          }
        }, 600);

        return () => clearTimeout(moveTimer);
      }

      setDice(0);

      const nextTurn = (turn + 1) % 4;

      setTurn(nextTurn);

      setMsg(
        `${players[nextTurn].name}'s turn`
      );
    }, 700);

    return () => clearTimeout(timer);
  }, [turn, dice, players]);

  if (screen === "home") {
    return (
      <main className="app">
        <div className="hero">
          <div className="brand">
            LUDO <span>PARTY</span>
          </div>

          <p>
            DESI DHAMAKA • FUTURISTIC EDITION
          </p>

          <button
            className="primary"
            onClick={() => setScreen("game")}
            type="button"
          >
            PLAY OFFLINE
          </button>

          <button
            className="secondary"
            onClick={() => setScreen("modes")}
            type="button"
          >
            GAME MODES
          </button>
        </div>

        <div className="cards">
          <div>
            <b>{coins}</b>
            <small>COINS</small>
          </div>

          <div>
            <b>LVL 1</b>
            <small>PROFILE</small>
          </div>

          <div>
            <b>PLUS</b>
            <small>PREMIUM</small>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "modes") {
    return (
      <main className="app">
        <section className="panel">
          <button
            className="back"
            onClick={() => setScreen("home")}
            type="button"
          >
            ← BACK
          </button>

          <h1>GAME MODES</h1>

          <div
            className="mode"
            onClick={() => setScreen("game")}
          >
            <b>SOLO VS BOTS</b>
            <span>
              Biryani • Chai • Paan
            </span>
          </div>

          <div className="mode locked">
            <b>ONLINE ROOMS</b>
            <span>
              Realtime multiplayer • coming next
            </span>
          </div>

          <div className="mode">
            <b>PASS & PLAY</b>
            <span>
              4 players on one device
            </span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="game">
      <header>
        <button
          className="back"
          onClick={() => {
            reset();
            setScreen("home");
          }}
          type="button"
        >
          ←
        </button>

        <div>
          <b>LUDO PARTY</b>
          <small>{msg}</small>
        </div>

        <div className="wallet">
          🪙 {coins}
        </div>
      </header>

      <div className="arena">
        <div className="players">
          {players.map((player, index) => (
            <div
              className={`player ${
                player.color
              } ${turn === index ? "active" : ""}`}
              key={player.color}
            >
              <b>{player.name}</b>

              <small>
                {winner(player)
                  ? "WINNER"
                  : index === turn
                  ? "TURN"
                  : "READY"}
              </small>
            </div>
          ))}
        </div>

        <Board
          players={players}
          onToken={move}
        />

        <div className="controls">
          <div
            className={`dice ${
              rolling ? "spin" : ""
            }`}
            onClick={roll}
          >
            {dice || "?"}
          </div>

          <button
            className="primary roll"
            onClick={roll}
            disabled={
              turn !== 0 || rolling
            }
            type="button"
          >
            ROLL DICE
          </button>

          <small>
            Need 6 to launch a token • Safe movement •
            Fair random dice
          </small>
        </div>
      </div>
    </main>
  );
             }
