import type {
    CtrlCMode,
    InputBindings,
    KeyEvent,
    KeyHandler,
} from './types.js';

export class InputController implements InputBindings {
    private readonly keyHandlers: Map<string, Array<{ handler: KeyHandler }>> = new Map();
    private readonly ctrlCHandlers: Array<{ mode: CtrlCMode; handler: KeyHandler }> = [];

    public onKey(name: string, handler: KeyHandler): () => void {
        const normalized = normalizeKeyName(name);
        const registrations = this.keyHandlers.get(normalized) ?? [];
        const registration = { handler };
        registrations.push(registration);
        this.keyHandlers.set(normalized, registrations);

        return () => {
            removeRegistration(registrations, registration);

            if (registrations.length === 0) {
                this.keyHandlers.delete(normalized);
            }
        };
    }

    public onCtrlC(mode: CtrlCMode | KeyHandler, handler?: KeyHandler): () => void {
        const entry = {
            mode: typeof mode === 'string' ? mode : 'soft',
            handler: typeof mode === 'function' ? mode : handler,
        };

        if (!entry.handler) {
            throw new Error('onCtrlC() requires a handler.');
        }

        const registration = { mode: entry.mode, handler: entry.handler };
        this.ctrlCHandlers.push(registration);

        return () => {
            removeRegistration(this.ctrlCHandlers, registration);
        };
    }

    public async emitKey(event: KeyEvent): Promise<void> {
        const normalized = normalizeKeyName(event.name);
        const registrations = this.keyHandlers.get(normalized);

        if (registrations) {
            for (const { handler } of [...registrations]) {
                await handler(event);
            }
        }

        if (event.ctrl && normalized === 'c') {
            await this.emitCtrlC(event);
        }
    }

    public async emitCtrlC(event: KeyEvent = { name: 'c', ctrl: true }): Promise<boolean> {
        let handled = false;

        for (const { handler } of [...this.ctrlCHandlers]) {
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

function removeRegistration<T>(registrations: T[], registration: T): void {
    const index = registrations.indexOf(registration);

    if (index >= 0) {
        registrations.splice(index, 1);
    }
}
