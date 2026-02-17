/**
 * WebChat middleware pipeline.
 * PRD §FR4.1 — WebChat with Fluent theme.
 *
 * Activity middleware: filters/modifies incoming/outgoing activities.
 * Attachment middleware: customises how specific attachment types render.
 */

/**
 * Creates the activity middleware pipeline.
 * Hides OAuthCard activities (handled by SSO interceptor).
 */
export function createActivityMiddleware() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => (next: any) => (...args: any[]) => {
        const [card] = args;
        if (card?.activity && !card.activity.id) {
            card.activity.id = Math.random().toString(36).substring(7);
        }

        // Hide OAuthCard attachments — SSO interceptor handles these
        if (
            card?.activity?.type === 'message' &&
            card?.activity?.attachments?.some(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (att: any) => att.contentType === 'application/vnd.microsoft.card.oauth'
            )
        ) {
            return false;
        }

        return next(...args);
    };
}

/**
 * Creates the attachment middleware pipeline.
 * Placeholder — extend in Phase 2+ for custom Adaptive Card rendering.
 */
export function createAttachmentMiddleware() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => (next: any) => (...args: any[]) => {
        return next(...args);
    };
}
