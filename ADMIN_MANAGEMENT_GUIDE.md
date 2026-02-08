# Admin Management Features - Implementation Guide

## Overview
This document describes how to implement comprehensive admin management features for your application.

## Features to Implement

### 1. Change Admin Password
**Location**: Admin Dashboard Header
- Button: "Change Password"
- Modal with fields:
  - Current Password (required)
  - New Password (required, min 6 chars)
  - Confirm New Password (required)
- Verification: Must verify current password before changing
- Uses: `supabase.auth.updateUser({ password: newPassword })`

### 2. Add New Admin
**Location**: Admin Dashboard Header
- Button: "Add Admin"  
- Modal with fields:
  - Full Name (required)
  - Email (required)
  - Password (required, min 6 chars)
- Process:
  1. Create user via `supabase.auth.signUp()`
  2. Update profile role to 'admin' in profiles table
  3. Refresh admins list

### 3. View All Admins
**Location**: Admin Dashboard Header
- Dropdown button: "Admins" with count badge
- Shows list of all admins with:
  - Name
  - Email
  - Created date
  - Current admin indicator (different styling)
- **Security**: Each admin must log in with their own credentials
- **No impersonation**: Admins cannot switch without logging out and back in

## Code Structure

### State Variables Needed
```typescript
const [admins, setAdmins] = useState<any[]>([]);
const [currentAdmin, setCurrentAdmin] = useState<any>(null);
const [showAddAdminModal, setShowAddAdminModal] = useState(false);
const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
const [showAdminListDropdown, setShowAdminListDropdown] = useState(false);
const [addAdminForm, setAddAdminForm] = useState({ name: '', email: '', password: '' });
const [changePasswordForm, setChangePasswordForm] = useState({ 
  currentPassword: '', 
  newPassword: '', 
  confirmPassword: '' 
});
const [adminSubmitting, setAdminSubmitting] = useState(false);
```

### Functions Needed

#### fetchAdmins()
```typescript
const fetchAdmins = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current admin info
    const { data: currentAdminData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setCurrentAdmin(currentAdminData);

    // Get all admins
    const { data: allAdmins } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    setAdmins(allAdmins || []);
  } catch (err: any) {
    console.error('Error fetching admins:', err);
  }
};
```

#### handleAddAdmin()
```typescript
const handleAddAdmin = async (e: React.FormEvent) => {
  e.preventDefault();
  setAdminSubmitting(true);

  try {
    // Validation
    if (!addAdminForm.name || !addAdminForm.email || !addAdminForm.password) {
      throw new Error('All fields are required');
    }

    if (addAdminForm.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Create user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: addAdminForm.email,
      password: addAdminForm.password,
      options: { data: { full_name: addAdminForm.name } }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Set admin role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id);

    if (updateError) throw updateError;

    showToast(`Admin "${addAdminForm.name}" created successfully!`, 'success');
    setShowAddAdminModal(false);
    setAddAdminForm({ name: '', email: '', password: '' });
    await fetchAdmins();
  } catch (err: any) {
    showToast(err.message || 'Failed to create admin', 'error');
  } finally {
    setAdminSubmitting(false);
  }
};
```

#### handleChangePassword()
```typescript
const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setAdminSubmitting(true);

  try {
    // Validation
    if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
      throw new Error('All fields are required');
    }

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      throw new Error('New passwords do not match');
    }

    if (changePasswordForm.newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentAdmin.email,
      password: changePasswordForm.currentPassword
    });

    if (signInError) throw new Error('Current password is incorrect');

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: changePasswordForm.newPassword
    });

    if (updateError) throw updateError;

    showToast('Password changed successfully!', 'success');
    setShowChangePasswordModal(false);
    setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  } catch (err: any) {
    showToast(err.message || 'Failed to change password', 'error');
  } finally {
    setAdminSubmitting(false);
  }
};
```

## UI Components

### Header with Admin Management Buttons
```tsx
<div className="flex items-center gap-3">
  {/* Change Password Button */}
  <button
    onClick={() => setShowChangePasswordModal(true)}
    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
  >
    <Key className="h-4 w-4" />
    Change Password
  </button>

  {/* Add Admin Button */}
  <button
    onClick={() => setShowAddAdminModal(true)}
    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
  >
    <UserPlus className="h-4 w-4" />
    Add Admin
  </button>

  {/* View Admins Dropdown */}
  <div className="relative">
    <button
      onClick={() => setShowAdminListDropdown(!showAdminListDropdown)}
      className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
    >
      <Shield className="h-4 w-4" />
      Admins ({admins.length})
      <ChevronDown className="h-4 w-4" />
    </button>

    {showAdminListDropdown && (
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 mb-3">All Admins</h3>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div 
                key={admin.id} 
                className={`p-3 rounded-lg ${admin.id === currentAdmin?.id ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {admin.email}
                      {admin.id === currentAdmin?.id && (
                        <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded">You</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Added {new Date(admin.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Logout Button */}
  <button
    onClick={handleLogout}
    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50"
  >
    Logout
  </button>
</div>
```

### Change Password Modal
```tsx
{showChangePasswordModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
        <button onClick={() => setShowChangePasswordModal(false)}>
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>
      <form onSubmit={handleChangePassword} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
          <input
            type="password"
            value={changePasswordForm.currentPassword}
            onChange={(e) => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            value={changePasswordForm.newPassword}
            onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={changePasswordForm.confirmPassword}
            onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={adminSubmitting}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {adminSubmitting ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  </div>
)}
```

### Add Admin Modal
```tsx
{showAddAdminModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Add New Admin</h2>
        <button onClick={() => setShowAddAdminModal(false)}>
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>
      <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            value={addAdminForm.name}
            onChange={(e) => setAddAdminForm({ ...addAdminForm, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={addAdminForm.email}
            onChange={(e) => setAddAdminForm({ ...addAdminForm, email: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            value={addAdminForm.password}
            onChange={(e) => setAddAdminForm({ ...addAdminForm, password: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
            minLength={6}
          />
          <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
        </div>
        <button
          type="submit"
          disabled={adminSubmitting}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {adminSubmitting ? 'Creating...' : 'Create Admin'}
        </button>
      </form>
    </div>
  </div>
)}
```

## Security Considerations

1. **No Direct Admin Switching**: The dropdown only shows admin list, it doesn't allow switching. Each admin must log out and log in with their credentials.

2. **Password Verification**: When changing password, the current password must be verified first.

3. **Role Assignment**: New admins get the 'admin' role in the profiles table, granting them access to admin features.

4. **Authentication**: All admin operations require valid authentication and admin role check.

## Next Steps

1. The AdminDashboard.tsx file needs to be fixed due to corruption
2. Add the state variables listed above
3. Add the three functions (fetchAdmins, handleAddAdmin, handleChangePassword)
4. Add the UI components to the header
5. Call `fetchAdmins()` in the useEffect hook
6. Test all three features thoroughly
