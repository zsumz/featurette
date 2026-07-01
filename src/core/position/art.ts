export function normalizeArtLines(art: string): string[] {
    const raw = art.replace(/^\n/, '').replace(/\n\s*$/, '');
    const lines = raw.split(/\r?\n/);
    const indent = Math.min(
        ...lines
            .filter((line) => line.trim().length > 0)
            .map((line) => /^\s*/.exec(line)?.[0].length ?? 0),
    );

    if (!Number.isFinite(indent)) {
        return [];
    }

    return lines.map((line) => line.slice(indent));
}
