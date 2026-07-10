export interface ParsedPlayCliFlags {
    color: boolean;
    noUnicode: boolean;
    reducedMotion: boolean;
    transcript: boolean;
    skip: boolean;
    noAltScreen: boolean;
    noAnsi: boolean;
    speed?: number;
    scene?: string;
}

export function parsePlayCliFlags(argv: string[]): ParsedPlayCliFlags {
    const flags: ParsedPlayCliFlags = {
        color: true,
        noUnicode: false,
        reducedMotion: false,
        transcript: false,
        skip: false,
        noAltScreen: false,
        noAnsi: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--no-color') flags.color = false;
        else if (arg === '--no-unicode') flags.noUnicode = true;
        else if (arg === '--reduced-motion') flags.reducedMotion = true;
        else if (arg === '--transcript') flags.transcript = true;
        else if (arg === '--skip') flags.skip = true;
        else if (arg === '--no-alt-screen') flags.noAltScreen = true;
        else if (arg === '--no-ansi') flags.noAnsi = true;
        else if (arg === '--speed') flags.speed = Number(argv[++index] ?? '1');
        else if (arg === '--scene') flags.scene = argv[++index];
    }

    return flags;
}
