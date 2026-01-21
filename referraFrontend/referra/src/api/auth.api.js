const API_BASE_URL = 'http://localhost:5500/api'

const handleJsonResponse = async (res, defaultMessage) => {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    const error = new Error(errorBody?.message || defaultMessage)
    error.status = res.status
    throw error
  }
  return await res.json()
}

// ---------- AUTH APIs ----------

export const signup = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return handleJsonResponse(res, 'Failed to sign up.')
}

export const signin = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  return handleJsonResponse(res, 'Failed to sign in.')
}

export const logout = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  return handleJsonResponse(res, 'Failed to logout.')
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
  return handleJsonResponse(res, 'Failed to verify email.')
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
  return handleJsonResponse(res, 'Failed to send password reset email.')
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
  return handleJsonResponse(res, 'Failed to reset password.')
}

export const getCurrentUser = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  })
  return handleJsonResponse(res, 'Failed to get current user.')
}

// HR management – create/invite HR (must be called as logged-in HR)
export const createHr = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/hr/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return handleJsonResponse(res, 'Failed to create HR user.')
}
