import type { TerminalSize } from '../core/types.js';
import type { ReadableTTYLike, WritableTTYLike } from './session.js';

export interface DoctorOptions {
    input?: ReadableTTYLike;
    output?: WritableTTYLike;
    env?: Record<string, string | undefined>;
    minSize?: TerminalSize;
    write?: boolean;
}

export interface DoctorReport {
    isTTY: boolean;
    columns: number;
    rows: number;
    colorDepth: number;
    color: boolean;
    trueColor: boolean;
    unicode: boolean;
    rawInput: boolean;
    altScreen: boolean;
    reducedMotion: boolean;
    noColor: boolean;
    minSize?: TerminalSize;
    sizeOk: boolean;
    verdict: 'ready' | 'limited';
    warnings: string[];
}

export function inspectTerminal(options: DoctorOptions = {}): DoctorReport {
    const input = options.input ?? process.stdin;
    const output = options.output ?? process.stdout;
    const env = options.env ?? process.env;
    const columns = streamColumns(output, 80);
    const rows = streamRows(output, 24);
    const colorDepth =
        typeof output.getColorDepth === 'function' ? output.getColorDepth() : 1;
    const noColor = env.NO_COLOR !== undefined || env.TERM === 'dumb';
    const unicode = env.LC_ALL !== 'C' && env.LANG !== 'C';
    const reducedMotion =
        env.FEATURETTE_REDUCED_MOTION === '1' ||
        env.NO_MOTION === '1' ||
        env.REDUCED_MOTION === '1';
    const minSize = options.minSize;
    const sizeOk = minSize === undefined || columns >= minSize.columns && rows >= minSize.rows;
    const warnings: string[] = [];

    if (output.isTTY !== true) warnings.push('stdout is not a TTY; playback will prefer transcript mode.');
    if (minSize !== undefined && !sizeOk) {
        warnings.push(`terminal is smaller than ${String(minSize.columns)}x${String(minSize.rows)}.`);
    }
    if (noColor) warnings.push('color output is disabled or unavailable.');
    if (!unicode) warnings.push('unicode support looks limited.');
    if (input.isTTY !== true || input.setRawMode === undefined) warnings.push('raw keyboard input is unavailable.');

    return {
        isTTY: output.isTTY === true,
        columns,
        rows,
        colorDepth,
        color: colorDepth > 1 && !noColor,
        trueColor: colorDepth >= 24 && !noColor,
        unicode,
        rawInput: input.isTTY === true && typeof input.setRawMode === 'function',
        altScreen: output.isTTY === true,
        reducedMotion,
        noColor,
        minSize,
        sizeOk,
        verdict: warnings.length === 0 ? 'ready' : 'limited',
        warnings,
    };
}

export function formatDoctorReport(report: DoctorReport): string {
    const lines = [
        'Featurette Doctor',
        '',
        `TTY: ${yesNo(report.isTTY)}`,
        `Size: ${String(report.columns)} x ${String(report.rows)}${report.minSize ? ` (minimum ${String(report.minSize.columns)} x ${String(report.minSize.rows)})` : ''}`,
        `Color: ${report.trueColor ? 'truecolor' : report.color ? `${String(report.colorDepth)}-bit` : 'no'}`,
        `Unicode: ${yesNo(report.unicode)}`,
        `Raw input: ${yesNo(report.rawInput)}`,
        `Alt screen: ${yesNo(report.altScreen)}`,
        `Reduced motion: ${yesNo(report.reducedMotion)}`,
        '',
        report.verdict === 'ready'
            ? 'You are ready to feel weirdly emotional about stdout.'
            : 'Limited mode recommended.',
    ];

    if (report.warnings.length > 0) {
        lines.push('', 'Warnings:');

        for (const warning of report.warnings) {
            lines.push(`- ${warning}`);
        }
    }

    return lines.join('\n');
}

export function doctor(options: DoctorOptions = {}): DoctorReport {
    const report = inspectTerminal(options);

    if (options.write ?? true) {
        (options.output ?? process.stdout).write(`${formatDoctorReport(report)}\n`);
    }

    return report;
}

function yesNo(value: boolean): 'yes' | 'no' {
    return value ? 'yes' : 'no';
}

function streamColumns(stream: WritableTTYLike, fallback: number): number {
    return typeof stream.columns === 'number' ? stream.columns : fallback;
}

function streamRows(stream: WritableTTYLike, fallback: number): number {
    return typeof stream.rows === 'number' ? stream.rows : fallback;
}
