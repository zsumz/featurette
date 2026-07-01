export interface KeyEvent {
    name: string;
    sequence?: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
}

export type KeyHandler = (event: KeyEvent) => void | Promise<void>;
export type CtrlCMode = 'soft' | 'hard';

export class InputController {
    private readonly keyHandlers: Map<string, Set<KeyHandler>> = new Map();
    private readonly ctrlCHandlers: Array<{ mode: CtrlCMode; handler: KeyHandler }> = [];

    public onKey(name: string, handler: KeyHandler): () => void {
        const normalized = normalizeKeyName(name);
        const handlers = this.keyHandlers.get(normalized) ?? new Set<KeyHandler>();
        handlers.add(handler);
        this.keyHandlers.set(normalized, handlers);

        return () => handlers.delete(handler);
    }

    public onCtrlC(mode: CtrlCMode | KeyHandler, handler?: KeyHandler): () => void {
        const entry = {
            mode: typeof mode === 'string' ? mode : 'soft',
            handler: typeof mode === 'function' ? mode : handler,
        };

        if (!entry.handler) {
            throw new Error('onCtrlC() requires a handler.');
        }

        this.ctrlCHandlers.push({ mode: entry.mode, handler: entry.handler });

        return () => {
            const index = this.ctrlCHandlers.findIndex((candidate) => candidate.handler === entry.handler);
            if (index >= 0) {
                this.ctrlCHandlers.splice(index, 1);
            }
        };
    }

    public async emitKey(event: KeyEvent): Promise<void> {
        const normalized = normalizeKeyName(event.name);
        const handlers = this.keyHandlers.get(normalized);

        if (handlers) {
            for (const handler of handlers) {
                await handler(event);
            }
        }

        if (event.ctrl && normalized === 'c') {
            await this.emitCtrlC(event);
        }
    }

    public async emitCtrlC(event: KeyEvent = { name: 'c', ctrl: true }): Promise<boolean> {
        let handled = false;

        for (const { handler } of this.ctrlCHandlers) {
            handled = true;
            await handler(event);
        }

        return handled;
    }

    public clear(): void {
        this.keyHandlers.clear();
        this.ctrlCHandlers.length = 0;
    }
}

function normalizeKeyName(name: string): string {
    return name.toLowerCase();
}
