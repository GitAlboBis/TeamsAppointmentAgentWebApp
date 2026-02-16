declare module 'dexie-react-hooks' {
    export function useLiveQuery<T>(querier: () => Promise<T> | T, deps?: any[]): T | undefined;
    export function useLiveQuery<T, TDefault>(querier: () => Promise<T> | T, deps: any[], defaultResult: TDefault): T | TDefault;
}
