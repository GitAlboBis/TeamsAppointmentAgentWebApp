import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react';
import { FluentProvider, type Theme } from '@fluentui/react-components';
import { customLightTheme, customDarkTheme } from './fluentTheme';

interface ThemeContextValue {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    // Initialize state from local storage or system preference
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('theme-preference');
        if (stored) {
            return stored === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const toggleTheme = useCallback(() => {
        setIsDark((prev) => {
            const newValue = !prev;
            localStorage.setItem('theme-preference', newValue ? 'dark' : 'light');
            return newValue;
        });
    }, []);

    const setTheme = useCallback((dark: boolean) => {
        setIsDark(dark);
        localStorage.setItem('theme-preference', dark ? 'dark' : 'light');
    }, []);

    // Sync with system changes if no manual override (optional, but good UX)
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('theme-preference')) {
                setIsDark(e.matches);
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const value = useMemo(
        () => ({
            theme: isDark ? customDarkTheme : customLightTheme,
            isDark,
            toggleTheme,
            setTheme,
        }),
        [isDark, toggleTheme, setTheme]
    );

    return (
        <ThemeContext.Provider value={value}>
            <FluentProvider theme={value.theme}>
                {children}
            </FluentProvider>
        </ThemeContext.Provider>
    );
}

