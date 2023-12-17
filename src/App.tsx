import React, { FormEvent } from "react";
import { Game } from "./lib/Game";
import { LogEntry } from "./lib/types/LogEntry";
import { PlayerSummary } from "./lib/Player";
import { AIAttacker } from "./lib/ai/attacker";

let commandHistoryIndex = 0;
const commandHistory: string[] = [];
const logs: LogEntry[] = [];
const _addLog = (log: LogEntry) => logs.unshift(log);
let game: Game | undefined;

function App() {
  const [, setLogIndex] = React.useState<number>(0);
  const addLog = React.useCallback((log: LogEntry) => {
    _addLog(log);
    setLogIndex((current) => current + 1);
  }, []);
  const clear = React.useCallback(() => {
    logs.length = 0;
    setLogIndex(0);
    addLog({
      color: "text-info",
      text: "Welcome to Empires of Satoshi. Type help to begin.",
    });
  }, [addLog]);

  React.useEffect(() => {
    clear();
  }, [clear]);

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const inputRefCurrent = inputRef.current;
    if (!inputRefCurrent) {
      return;
    }
    const keyListener = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        if (ev.key === "ArrowDown") {
          commandHistoryIndex = Math.min(
            commandHistoryIndex + 1,
            commandHistory.length
          );
        }

        if (ev.key === "ArrowUp") {
          commandHistoryIndex = Math.max(commandHistoryIndex - 1, 0);
        }
        inputRefCurrent.value = commandHistory[commandHistoryIndex] || "";
      }
    };
    inputRefCurrent.addEventListener("keyup", keyListener);
    return () => {
      inputRefCurrent.removeEventListener("keyup", keyListener);
    };
  }, [inputRef]);

  const onSubmit = React.useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const command = inputRef.current?.value;
      if (!command) {
        return;
      }

      commandHistory.push(command);
      commandHistoryIndex = commandHistory.length;
      inputRef.current.value = "";
      const logEntry: LogEntry = {
        text: command,
      };
      addLog(logEntry);

      switch (command) {
        case "help":
          addLog({
            color: "text-info",
            text: "Available commands: start, clear",
          });
          break;
        case "clear":
          clear();
          break;
        case "start":
          if (game) {
            addLog({
              color: "text-warning",
              text: "Game already started",
            });
            logEntry.color = "text-error";
            return;
          }
          game = new Game({
            addLog,
            listeners: {
              onNextDay: () => {
                // TODO: move to game
                addLog({ text: `Day ${game!.dayNumber}` });

                addLog({ text: "YOU" });

                logPlayerSummary(game!.getPlayerSummary(), "text-success");
                addLog({ text: "ENEMY (GATHERED FROM INTEL)" });
                logEnemySummary();

                addLog({ text: "Your turn" });
                addLog({
                  text:
                    "Enter skills to improve: \n" +
                    Object.keys(game!.getPlayerSummary().stats)
                      .map((key, index) => `  - [${index}] ${key}`)
                      .join("\n"),
                  color: "text-info",
                });

                function logPlayerSummary(
                  summary: PlayerSummary,
                  color: LogEntry["color"]
                ) {
                  addLog({
                    text: `Health: ${Math.floor(
                      (100 * summary.health) / summary.stats.maxHealth
                    )}%`,
                    color,
                  });
                  addLog({
                    text: `Resources: ${summary.resources} BTC`,
                    color,
                  });
                  addLog({
                    text: `Stats: ${JSON.stringify(summary.stats)}`,
                    color,
                  });
                }

                function logEnemySummary() {
                  logPlayerSummary(game!.getEnemySummary(), "text-error");
                }
              },
            },
          });
          game.nextDay();
          break;
        default:
          if (game) {
            game.increaseStat(command as keyof PlayerSummary["stats"], 0);
            if (!game.canMove(0)) {
              addLog({ text: "Enemy turn" });
              while (game.canMove(1)) {
                game.increaseStat(AIAttacker.spendResource(), 1);
              }
              game.nextDay();
            }
            break;
          }

          addLog({
            color: "text-warning",
            text: "Unknown command: " + command + ". Type help for more info",
          });
          logEntry.color = "text-error";
          return;
      }
    },
    [addLog, clear]
  );

  return (
    <div className="mockup-code w-full h-full rounded-none font-mono flex flex-col">
      <div className="flex-1 overflow-y-scroll flex flex-col-reverse">
        {logs.map((log, i) => (
          <pre key={i} data-prefix=">" className={log.color}>
            <code>{log.text}</code>
          </pre>
        ))}
      </div>
      <form onSubmit={onSubmit} className="text-success p-4 pb-0 w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder=""
          className="input input-bordered input-success w-full bg-transparent"
          autoFocus
        />
      </form>
    </div>
  );
}

export default App;
