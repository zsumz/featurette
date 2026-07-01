export interface Clock {
    now(): number;
    wait(ms: number): Promise<void>;
}
