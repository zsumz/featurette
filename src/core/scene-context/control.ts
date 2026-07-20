const interruptControls: WeakSet<SceneControlError> = new WeakSet();

export class SceneControlError extends Error {
    constructor(public readonly action: 'skip-scene' | 'quit') {
        super(action);
    }
}

export function asInterruptControl(error: SceneControlError): SceneControlError {
    const control = new SceneControlError(error.action);
    interruptControls.add(control);
    return control;
}

export function isInterruptControl(error: SceneControlError): boolean {
    return interruptControls.has(error);
}
