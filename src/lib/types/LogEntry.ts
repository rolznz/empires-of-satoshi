export type LogEntry = {
  text: string;
  color?:
    | "text-info"
    | "text-warning"
    | "text-success"
    | "text-neutral"
    | "text-error";
};
