/**
 * Centralized API client for all backend requests.
 * All fetch calls should go through these helpers so error handling,
 * headers, and base URL are consistent across features.
 */

const BASE_URL = '';

async function request(endpoint, { method = 'GET', body, headers = {} } = {}) {
    const config = {
        method,
        credentials: 'include',
        headers: { ...headers },
    };

    if (body instanceof FormData) {
        config.body = body;
    } else if (body !== undefined) {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
}

export function apiGet(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(qs ? `${endpoint}?${qs}` : endpoint, { method: 'GET' });
}

export function apiPost(endpoint, data) {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    return request(endpoint, { method: 'POST', body: formData });
}

export function apiPostForm(endpoint, formData) {
    return request(endpoint, { method: 'POST', body: formData });
}

const api = { get: apiGet, post: apiPost, postForm: apiPostForm };
export default api;
