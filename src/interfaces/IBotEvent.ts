export interface IBotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args: any) => void
}