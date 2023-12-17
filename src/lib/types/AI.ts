import { PlayerSummary } from "../Player";

export type AI = {
  // TODO: consider health and resources available, current stats, intel, etc.
  spendResource: () => keyof PlayerSummary["stats"] | "random";
};
