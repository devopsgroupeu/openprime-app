import keycloak from '../config/keycloak';
import { getApiUrl } from '../utils/envValidator';

export class AuthService {
  constructor() {
    this.baseURL = getApiUrl();
  }

  getAuthHeaders() {
    const token = keycloak.token;
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async makeAuthenticatedRequest(url, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });

      if (response.status === 401) {
        keycloak.logout();
        throw new Error('Session expired');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(url) {
    const response = await this.makeAuthenticatedRequest(url);
    return response.json();
  }

  async post(url, data, options = {}) {
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });

    if (options.responseType === 'blob') {
      return { data: await response.blob() };
    }

    return response.json();
  }

  async put(url, data) {
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async delete(url) {
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'DELETE'
    });
    return response.json();
  }

  async uploadFile(url, file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${keycloak.token}`
      }
    });
    return response.json();
  }
}

const authService = new AuthService();
export default authService;
