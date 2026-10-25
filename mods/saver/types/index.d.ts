export type Stats = {
  turns: number
  switched: number
  spent: number
  saved: number
  note: string
}

declare module 'claude-code' {
  interface PluginState {
    saver: { stats: Stats; isEnabled: boolean; isHidden: boolean }
  }
}
