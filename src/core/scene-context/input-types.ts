import type { CtrlCMode, KeyHandler } from '../input.js';

export interface InputAPI {
    onKey(name: string, handler: KeyHandler): () => void;
    onCtrlC(mode: CtrlCMode | KeyHandler, handler?: KeyHandler): () => void;
}
