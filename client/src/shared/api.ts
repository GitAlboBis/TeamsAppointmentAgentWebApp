import { API_BASE_URL } from './constants';

/**
 * Authenticated POST request to the backend API.
 */
export async function apiPost<T>(
    path: string,
    body: Record<string, unknown>,
    token: string
): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((error as { error?: string }).error ?? `API error ${res.status}`);
    }

    return res.json() as Promise<T>;
}

/**
 * Authenticated GET request to the backend API.
 */
export async function apiGet<T>(path: string, token: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((error as { error?: string }).error ?? `API error ${res.status}`);
    }

    return res.json() as Promise<T>;
}
