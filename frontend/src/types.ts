type LogEntry = {
  timestamp?: string;
  entry: string;
};

type DeploymentStatus =
  | "idle"
  | "uploading"
  | "deploying"
  | "deployed"
  | "failed";

export type { LogEntry, DeploymentStatus };
