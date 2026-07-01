import type { TerminalInfo, TerminalSize } from '../types.js';

interface TerminalInfoOutput {
    columns?: number;
    rows?: number;
    isTTY?: boolean;
    getColorDepth?: () => number;
}

interface TerminalInfoSource {
    output?: TerminalInfoOutput;
    env?: Pick<NodeJS.ProcessEnv, 'LC_ALL'>;
}

export function resolveTerminalInfo(
    minimum: TerminalSize | undefined,
    terminal: Partial<TerminalInfo> = {},
    source: TerminalInfoSource = {},
): TerminalInfo {
    const output = source.output ?? process.stdout;
    const env = source.env ?? process.env;
    const columns = terminal.columns ?? minimum?.columns ?? streamColumns(output, 80);
    const rows = terminal.rows ?? minimum?.rows ?? streamRows(output, 24);

    return {
        columns,
        rows,
        isTTY: terminal.isTTY ?? output.isTTY ?? false,
        colorDepth:
      terminal.colorDepth ??
      (typeof output.getColorDepth === 'function' ? output.getColorDepth() : 1),
        unicode: terminal.unicode ?? env.LC_ALL !== 'C',
    };
}

function streamColumns(stream: TerminalInfoOutput, fallback: number): number {
    const value = stream.columns;
    return typeof value === 'number' ? value : fallback;
}

function streamRows(stream: TerminalInfoOutput, fallback: number): number {
    const value = stream.rows;
    return typeof value === 'number' ? value : fallback;
}
