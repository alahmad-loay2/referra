const API_BASE_URL = 'http://localhost:5500/api'

export const verifyEmail = async (accessToken, refreshToken) => {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    const error = new Error(errorBody?.message || 'Failed to verify email.')
    error.status = res.status
    throw error
  }

  return await res.json()
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

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    const error = new Error(errorBody?.message || 'Failed to send password reset email.')
    error.status = res.status
    throw error
  }

  return await res.json()
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
      new_password: newPassword 
    }),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    const error = new Error(errorBody?.message || 'Failed to reset password.')
    error.status = res.status
    throw error
  }

  return await res.json()
}
