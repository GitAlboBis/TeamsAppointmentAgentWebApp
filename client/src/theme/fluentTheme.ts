import {
    createLightTheme,
    createDarkTheme,
    type BrandVariants,
    type Theme,
} from '@fluentui/react-components';

/**
 * Custom brand palette based on Microsoft Blue (#0078D4).
 * Generated from Fluent UI 2 theme designer.
 * PRD §7.2 — Design Tokens.
 */
const brandVariants: BrandVariants = {
    10: '#001D33',
    20: '#00304D',
    30: '#004578',
    40: '#005A9E',
    50: '#006CBE',
    60: '#0078D4',
    70: '#2B88D8',
    80: '#56A8E2',
    90: '#7BBCEB',
    100: '#9ECEF3',
    110: '#BFDFFA',
    120: '#D6EBFF',
    130: '#E8F3FF',
    140: '#F3F9FF',
    150: '#FAFCFF',
    160: '#FFFFFF',
};

export const customLightTheme: Theme = {
    ...createLightTheme(brandVariants),
};

export const customDarkTheme: Theme = {
    ...createDarkTheme(brandVariants),
};

// Ensure the dark theme background matches Fluent 2 dark mode defaults
customDarkTheme.colorBrandForeground1 = brandVariants[110];
customDarkTheme.colorBrandForeground2 = brandVariants[120];
