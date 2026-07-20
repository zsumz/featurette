export interface KeyEvent {
    name: string;
    sequence?: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
}

export type KeyHandler = (event: KeyEvent) => void | Promise<void>;
export type CtrlCMode = 'soft' | 'hard';

export interface InputBindings {
    onKey(name: string, handler: KeyHandler): () => void;
    onCtrlC(mode: CtrlCMode | KeyHandler, handler?: KeyHandler): () => void;
}
