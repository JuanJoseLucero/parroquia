import keycloak from '../keycloak';

const API_BASE = import.meta.env.PROD
    ? '/api'
    : '/maux-backend_catequesis/api';

export async function post(endpoint, body = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (keycloak.authenticated) {
        headers['Authorization'] = `Bearer ${keycloak.token}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        if (res.status === 204) return null;
        const msg = await res.text().catch(() => 'Error desconocido');
        throw new Error(msg);
    }
    return res.json();
}
