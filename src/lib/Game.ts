import { Player, PlayerSummary } from "./Player";
import { LogEntry } from "./types/LogEntry";

type GameConfig = {
  addLog: (log: LogEntry) => void;
  listeners: {
    onNextDay: () => void;
  };
};

export class Game {
  private _config: GameConfig;
  private _dayNumber: number;
  private _players: Player[];
  private _hasFinished: boolean;

  get dayNumber() {
    return this._dayNumber;
  }

  constructor(config: GameConfig) {
    this._config = config;
    this._dayNumber = 0;
    this._hasFinished = false;
    this._players = [new Player(0), new Player(1)];
    this._config.addLog({ text: "---" });
    this._config.addLog({ text: "---", color: "text-warning" });
    this._config.addLog({ text: "---", color: "text-info" });
    this._config.addLog({ text: "---", color: "text-success" });
    this._config.addLog({ text: "New game started" });
  }

  increaseStat(
    command: keyof Player["stats"] | "random",
    playerIndex: number
  ): boolean {
    const player = this._players[playerIndex];
    const statsKeys = Object.keys(player.stats);

    const commandKey = (
      command === "random"
        ? statsKeys[Math.floor(Math.random() * statsKeys.length)]
        : statsKeys[parseInt(command)] || command
    ) as keyof typeof player.stats;

    if (statsKeys.indexOf(commandKey) === -1) {
      this._config.addLog({
        text: "Command not found: " + commandKey,
        color: "text-error",
      });
      return false;
    }
    if (player.resources <= 0) {
      this._config.addLog({
        text: "Insufficient resources",
        color: "text-error",
      });
      return false;
    }
    --player.resources;
    ++player.stats[commandKey];
    this._config.addLog({
      text:
        commandKey +
        " is now " +
        player.stats[commandKey] +
        ". Resources left: " +
        player.resources,
      color: "text-success",
    });

    return true;
  }

  nextDay() {
    if (this._hasFinished) {
      return;
    }

    for (const player of this._players) {
      player.health = Math.min(
        player.health + player.stats.recovery,
        player.stats.maxHealth
      );
      player.health -= Math.max(
        this.getEnemyOf(player).stats.attack - player.stats.defense,
        0
      );
      player.health = Math.min(
        Math.max(player.health, 0),
        player.stats.maxHealth
      );
      if (player.health === 0) {
        this._config.addLog({ text: `Player ${player.index} has fallen` });
        this._hasFinished = true;
      }
    }
    if (this._hasFinished) {
      return;
    }

    ++this._dayNumber;

    for (const player of this._players) {
      player.resources +=
        player.stats.resourceGathering -
        this.getEnemyOf(player).stats.resourceSabotage;
    }
    this._config.listeners.onNextDay();
  }

  canMove(index: number) {
    return this._players[index].resources > 0;
  }

  getEnemyOf(player: Player): Player {
    return this._players[1 - player.index];
  }

  getPlayerSummary(index = 0): PlayerSummary {
    return {
      stats: this._players[index].stats,
      health: this._players[index].health,
      resources: this._players[index].resources,
    };
  }

  getEnemySummary(): PlayerSummary {
    const self = this._players[0];
    const enemy = this._players[1];
    const reliability = Math.max(
      (self.stats.intel - enemy.stats.antiIntel) /
        Math.max(self.stats.intel + enemy.stats.antiIntel, 1)
    );

    const totalStats = this._dayNumber - 1;
    const estimate = (actual: number) =>
      Math.round(
        actual * reliability + Math.random() * (1 - reliability) * totalStats
      );

    const stats = {} as Player["stats"];
    (Object.keys(enemy.stats) as (keyof typeof stats)[]).forEach((key) => {
      stats[key] = estimate(enemy.stats[key]);
    });

    const health = Math.max(estimate(enemy.health), 1);
    const resources = Math.max(estimate(enemy.resources), 1);
    stats.maxHealth = Math.max(health, stats.maxHealth);
    return {
      stats,
      health,
      resources,
    };
  }
}
