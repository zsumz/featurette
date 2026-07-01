interface GraphemeSegmenter {
    segment(input: string): Iterable<{ segment: string }>;
}

type GraphemeSegmenterConstructor = new (
    locales?: string | string[],
    options?: { granularity: 'grapheme' },
) => GraphemeSegmenter;

export function charactersOf(value: string): string[] {
    const Segmenter = (Intl as unknown as { Segmenter?: GraphemeSegmenterConstructor }).Segmenter;

    if (Segmenter === undefined) {
        return Array.from(value);
    }

    const segmenter = new Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(value), (part) => part.segment);
}
