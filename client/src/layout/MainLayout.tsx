import type { ReactNode } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Header } from './Header';
import { Sidebar } from '@/sessions/Sidebar';
import { SIDEBAR_WIDTH } from '@/shared/constants';

const useStyles = makeStyles({
    root: {
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gridTemplateColumns: `${SIDEBAR_WIDTH}px 1fr`,
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: tokens.colorNeutralBackground2,
    },
    header: {
        gridColumn: '1 / -1',
    },
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground1,
        overflow: 'hidden',
        // Responsive — hidden on mobile via media query
        '@media (max-width: 768px)': {
            display: 'none',
        },
    },
    main: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        // On mobile, take full width when sidebar hidden
        '@media (max-width: 768px)': {
            gridColumn: '1 / -1',
        },
    },
});

interface MainLayoutProps {
    children: ReactNode;
    sidebar?: ReactNode;
}

/**
 * Main responsive layout: header + sidebar + chat area.
 *
 * PRD §7.1 — Layout grid.
 * PRD §FR4.7 — Responsive: desktop (sidebar visible), mobile (sidebar hidden).
 * code-organization.md §4 — MainLayout composes Header + Sidebar + ChatPane.
 */
export function MainLayout({ children, sidebar }: MainLayoutProps) {
    const styles = useStyles();

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <Header />
            </div>

            <aside className={styles.sidebar}>
                {sidebar ?? <Sidebar />}
            </aside>

            <main className={styles.main}>{children}</main>
        </div>
    );
}
