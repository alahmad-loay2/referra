const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5500/api'

export const signup = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return res.json()
}

export const signin = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

export const logout = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  return res.json()
}

export const verifyEmail = async (accessToken, refreshToken) => {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
  })
  return res.json()
}

export const forgotPassword = async (email) => {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  })
  return res.json()
}

export const resetPassword = async (accessToken, refreshToken, newPassword) => {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      new_password: newPassword,
    }),
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
