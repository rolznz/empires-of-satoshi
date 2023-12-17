type PlayerStats = {
  maxHealth: number;
  resourceGathering: number;
  resourceSabotage: number;
  attack: number;
  defense: number;
  recovery: number;
  intel: number;
  antiIntel: number;
};

export type PlayerSummary = Pick<Player, "stats" | "health" | "resources">;

export class Player {
  stats: PlayerStats;
  health: number;
  resources: number;
  index: number;

  constructor(index: number) {
    this.index = index;
    this.health = 10;
    this.resources = 0;

    // TODO: allow custom starting stats
    this.stats = {
      maxHealth: this.health,
      resourceGathering: 3,
      resourceSabotage: 0,
      recovery: 0,
      intel: 0,
      antiIntel: 0,
      attack: 0,
      defense: 0,
    };
  }
}
