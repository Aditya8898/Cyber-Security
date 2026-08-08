// Api helper utility for network requests to backend

const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('cyber_token');
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('cyber_token', token);
  } else {
    localStorage.removeItem('cyber_token');
  }
};

const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async post(endpoint, body, isMultipart = false) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(isMultipart),
      body: isMultipart ? body : JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async put(endpoint, body, isMultipart = false) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(isMultipart),
      body: isMultipart ? body : JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
