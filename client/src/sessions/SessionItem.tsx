
import { useState, useRef, useEffect } from 'react';
import {
    Button,
    makeStyles,
    tokens,
    Text,
    Menu,
    MenuTrigger,
    MenuList,
    MenuItem,
    MenuPopover,
    Input,
} from '@fluentui/react-components';
import { MoreHorizontal24Regular, Delete24Regular, Rename24Regular } from '@fluentui/react-icons';
import type { ChatSession } from './sessionDb';

const useStyles = makeStyles({
    root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        cursor: 'pointer',
        borderRadius: tokens.borderRadiusMedium,
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
    },
    active: {
        backgroundColor: tokens.colorNeutralBackground1Selected,
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground1Selected,
        },
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flex: 1,
        marginRight: '8px',
    },
    title: {
        fontWeight: tokens.fontWeightSemibold,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    timestamp: {
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase200,
    },
});

interface SessionItemProps {
    session: ChatSession;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRename?: (newTitle: string) => void;
}

export function SessionItem({ session, isActive, onSelect, onDelete, onRename }: SessionItemProps) {
    const styles = useStyles();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(session.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleRenameSubmit = () => {
        setIsEditing(false);
        if (editTitle.trim() && editTitle !== session.title && onRename) {
            onRename(editTitle.trim());
        } else {
            setEditTitle(session.title); // Revert if empty or unchanged
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRenameSubmit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditTitle(session.title);
        }
    };

    return (
        <div
            className={`${styles.root} ${isActive ? styles.active : ''}`}
            onClick={onSelect}
        >
            <div className={styles.content}>
                {isEditing ? (
                    <Input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(_e, data) => setEditTitle(data.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()} // Prevent selecting the session
                        size="small"
                    />
                ) : (
                    <Text className={styles.title} onDoubleClick={() => {
                        if (onRename) setIsEditing(true);
                    }}>
                        {session.title}
                    </Text>
                )}
                <Text className={styles.timestamp}>
                    {new Date(session.updatedAt).toLocaleDateString()}
                </Text>
            </div>

            <Menu>
                <MenuTrigger disableButtonEnhancement>
                    <Button
                        appearance="transparent"
                        icon={<MoreHorizontal24Regular />}
                        onClick={(e) => e.stopPropagation()} // Prevent selection when clicking menu
                    />
                </MenuTrigger>
                <MenuPopover>
                    <MenuList>
                        <MenuItem
                            icon={<Rename24Regular />}
                            onClick={() => {
                                if (onRename) setIsEditing(true);
                            }}
                        >
                            Rename
                        </MenuItem>
                        <MenuItem icon={<Delete24Regular />} onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}>
                            Delete
                        </MenuItem>
                    </MenuList>
                </MenuPopover>
            </Menu>
        </div>
    );
}
