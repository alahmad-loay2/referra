import { generateIdempotencyKey } from './idempotency.utils.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5500/api'

export const signup = async (payload) => {
  try {
    const endpoint = `${API_BASE_URL}/auth/signup`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Idempotency-Key': await generateIdempotencyKey('/auth/signup', payload),
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      let errorMessage = 'Failed to sign up';
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const errorText = await res.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error) {
    // Re-throw with a more user-friendly message for Safari/network issues
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
}

export const signin = async (email, password) => {
  try {
    const body = { email, password };
    const res = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Idempotency-Key': await generateIdempotencyKey('/auth/signin', body),
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errorMessage = 'Failed to sign in';
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const errorText = await res.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error) {
    // Re-throw with a more user-friendly message for Safari/network issues
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
}

export const logout = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  return res.json()
}

export const verifyEmail = async (accessToken, refreshToken) => {
  const body = { access_token: accessToken, refresh_token: refreshToken };
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': await generateIdempotencyKey('/auth/verify-email', body),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  return res.json()
}

export const forgotPassword = async (email) => {
  const body = { email };
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': await generateIdempotencyKey('/auth/forgot-password', body),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  return res.json()
}

export const resetPassword = async (accessToken, refreshToken, newPassword) => {
  const body = {
    access_token: accessToken,
    refresh_token: refreshToken,
    new_password: newPassword,
  };
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': await generateIdempotencyKey('/auth/reset-password', body),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  return res.json()
}

export const getCurrentUser = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  })

  if(!res.ok) {
    throw new Error('Failed to fetch current user.');
  }

  return res.json()
}

export const createHr = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/hr/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': await generateIdempotencyKey('/auth/hr/create', payload),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to create HR');
  }

  return res.json()
}
