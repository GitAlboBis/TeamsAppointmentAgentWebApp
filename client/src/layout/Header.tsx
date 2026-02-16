import {
    Toolbar,
    ToolbarButton,
    ToolbarDivider,
    Text,
    Persona,
    makeStyles,
    tokens,
} from '@fluentui/react-components';
import { SignOut24Regular, CalendarChat24Regular, WeatherMoon24Regular, WeatherSunny24Regular } from '@fluentui/react-icons';
import { useAuth } from '@/auth/useAuth';
import { useTheme } from '@/theme/ThemeContext';

const useStyles = makeStyles({
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: '48px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    titleGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    title: {
        fontWeight: tokens.fontWeightSemibold,
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
});

/**
 * Application header with title, user persona, and logout.
 * PRD §7.1 — Header Bar (App Title | User Avatar | Settings).
 * code-organization.md §4 — Header with Fluent Toolbar.
 */
export function Header() {
    const styles = useStyles();
    const { account, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const displayName = account?.name ?? account?.username ?? 'User';

    return (
        <header className={styles.header}>
            <div className={styles.titleGroup}>
                <CalendarChat24Regular />
                <Text className={styles.title} size={400}>
                    Appointment Agent
                </Text>
            </div>

            <Toolbar className={styles.actions}>
                <Persona
                    name={displayName}
                    size="small"
                    primaryText={displayName}
                    avatar={{ color: 'brand' }}
                />
                <ToolbarDivider />
                <ToolbarButton
                    icon={isDark ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
                    onClick={toggleTheme}
                    title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                />
                <ToolbarButton
                    icon={<SignOut24Regular />}
                    onClick={logout}
                    title="Sign out"
                />
            </Toolbar>
        </header>
    );
}
