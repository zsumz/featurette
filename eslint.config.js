import rubric from 'eslint-config-rubric';

export default [
    {
        ignores: [
            'coverage/**',
            'dist/**',
        ],
    },
    ...rubric,
];
