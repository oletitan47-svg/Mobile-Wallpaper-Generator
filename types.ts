
export interface Wallpaper {
  id: string;
  url: string;
  prompt: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
  RESULTS = 'RESULTS'
}
