export class SceneControlError extends Error {
    constructor(public readonly action: 'skip-scene' | 'quit') {
        super(action);
    }
}
