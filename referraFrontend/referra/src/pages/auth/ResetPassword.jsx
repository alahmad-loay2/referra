import React, { useState, useEffect } from 'react'
import { resetPassword } from '../../api/auth.api'

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if tokens are present in URL
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash

    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (!access_token || !refresh_token) {
      setStatus('Missing reset tokens in URL. Please use the link from your email.')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')

    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match.')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setStatus('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash

    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (!access_token || !refresh_token) {
      setStatus('Missing reset tokens. Please use the link from your email.')
      setLoading(false)
      return
    }

    try {
      const result = await resetPassword(access_token, refresh_token, newPassword)
      setStatus(result.message || 'Password reset successfully! You can now sign in.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setStatus(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Reset Password</h2>
      <p>Enter your new password below.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '5px' }}>
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            placeholder="Enter new password"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            placeholder="Confirm new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {status && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: status.includes('successfully') ? '#d4edda' : '#f8d7da',
            color: status.includes('successfully') ? '#155724' : '#721c24',
            borderRadius: '4px',
          }}
        >
          {status}
        </div>
      )}
    </div>
  )
}

export default ResetPassword
