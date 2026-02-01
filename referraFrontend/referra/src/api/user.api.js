const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5500/api'

export const getUserInfo = async () => {
  const res = await fetch(`${API_BASE_URL}/user/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch user information.');
  }

  return res.json()
}

export const updateUserInfo = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/user/me`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update user information.');
  }

  return res.json()
}
