import { useState } from 'react'
import { User, Lock, Save, CheckCircle2 } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { Alert, Spinner, Tabs } from '../components/ui'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getRoleBadgeClass, getRoleLabel } from '../utils/helpers'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', organizationName: user?.organizationName || '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await authAPI.updateProfile(profile)
      updateUser(res.data.user)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await authAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
      setSuccess('Password changed successfully.')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account</p>
        </div>

        {/* User info card */}
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-ink-700 border border-ink-600 flex items-center justify-center text-2xl font-bold text-amber-DEFAULT">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-ink-100 text-lg">{user?.name}</div>
            <div className="text-ink-400 text-sm">{user?.email}</div>
            <span className={`badge mt-1 ${getRoleBadgeClass(user?.role)}`}>{getRoleLabel(user?.role)}</span>
          </div>
        </div>

        <Tabs
          tabs={[
            { value: 'profile', label: 'Profile' },
            { value: 'security', label: 'Security' },
          ]}
          active={tab}
          onChange={(v) => { setTab(v); setError(''); setSuccess('') }}
        />

        <div className="mt-6">
          {success && <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-4" />}
          {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}

          {tab === 'profile' && (
            <form onSubmit={handleProfileSave} className="card p-6 space-y-4 animate-fade-in">
              <h2 className="font-bold text-ink-100 flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-amber-DEFAULT" /> Profile Information
              </h2>
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input opacity-60 cursor-not-allowed" value={user?.email} disabled />
                <p className="text-xs text-ink-600 mt-1">Email cannot be changed.</p>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+27 82 000 0000" />
              </div>
              {user?.role === 'organizer' && (
                <div>
                  <label className="label">Organization Name</label>
                  <input className="input" value={profile.organizationName} onChange={e => setProfile(p => ({ ...p, organizationName: e.target.value }))} />
                </div>
              )}
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={handlePasswordSave} className="card p-6 space-y-4 animate-fade-in">
              <h2 className="font-bold text-ink-100 flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-amber-DEFAULT" /> Change Password
              </h2>
              <div>
                <label className="label">Current Password</label>
                <input className="input" type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} required />
              </div>
              <div>
                <label className="label">New Password</label>
                <input className="input" type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required minLength={6} />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input className="input" type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} required />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Spinner size="sm" /> : <><Lock className="w-4 h-4" /> Update Password</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
