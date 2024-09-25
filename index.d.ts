declare module '@Joel/valen' {
  export function mainMenu(): Promise<void>;
  export function cleanupMac(): Promise<void>;
  export function setupIOS(): Promise<void>;
  export function setupAndroid(): Promise<void>;
  export function handleGitOptions(): Promise<void>;
  export function handleAiderOptions(): Promise<void>;
  export function handleFastlaneOptions(): Promise<void>;
  export function renameProject(newName?: string): Promise<void>;
  export function monitorLogs(logType?: string): Promise<void>;
  export function handleAutomatedBrowsing(query: string): Promise<void>;
}