// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import {
    ArrowLeft,
    Users,
    DollarSign,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Shield,
    Activity,
    UserPlus,
    X,
    Trash2,
    Key,
    Edit
} from 'lucide-react';
import Toast from '../components/Toast';

interface Signup {
    id: string;
    full_name: string;
    email: string;
    payment_status: string | null;
    amount: number | null;
    currency: string | null;
    created_at: string;
}

interface InfluencerStats {
    id: string;
    user_id: string;
    promo_code: string;
    name: string;
    email: string;
    total_signups: number;
    total_paid_signups: number;
    total_revenue: number;
    is_active: boolean;
    created_at: string;
    signups: Signup[];
}

export default function AdminDashboard() {
    const navigate = useNavigate();

    // State
    const [influencers, setInfluencers] = useState<InfluencerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [expandedInfluencer, setExpandedInfluencer] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Add Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [addInfluencerForm, setAddInfluencerForm] = useState({
        name: '',
        email: '',
        password: '',
        promoCode: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Password Reset Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerStats | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [influencerToDelete, setInfluencerToDelete] = useState<InfluencerStats | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    // Move User Modal State
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [signupToMove, setSignupToMove] = useState<Signup | null>(null);
    const [targetInfluencerCode, setTargetInfluencerCode] = useState('');
    const [moveSubmitting, setMoveSubmitting] = useState(false);

    // Add Signup Modal State
    const [showAddSignupModal, setShowAddSignupModal] = useState(false);
    const [selectedInfluencerForAdd, setSelectedInfluencerForAdd] = useState<InfluencerStats | null>(null);
    const [newSignup, setNewSignup] = useState({
        fullName: '',
        email: '',
        amount: 12.99,
        currency: 'USD',
        status: 'success'
    });
    const [addSignupSubmitting, setAddSignupSubmitting] = useState(false);

    // Admin Management State
    const [admins, setAdmins] = useState<any[]>([]);
    const [currentAdmin, setCurrentAdmin] = useState<any>(null);
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showAdminListDropdown, setShowAdminListDropdown] = useState(false);
    const [addAdminForm, setAddAdminForm] = useState({ name: '', email: '', password: '' });
    const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [adminSubmitting, setAdminSubmitting] = useState(false);

    useEffect(() => {
        fetchAdminData();
        fetchAdmins();
    }, []);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
    };

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                throw new Error('Not authenticated');
            }

            // Check if user is admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError || !profile || profile.role !== 'admin') {
                throw new Error('Access denied. Admin privileges required.');
            }

            // Fetch all influencers
            const { data: influencersData, error: influencersError } = await supabase
                .from('influencers')
                .select('*')
                .order('created_at', { ascending: false });

            if (influencersError) {
                throw influencersError;
            }

            // Fetch signups for each influencer
            const influencersWithSignups = await Promise.all(
                (influencersData || []).map(async (influencer) => {
                    const { data: signups, error: signupsError } = await supabase
                        .from('users_by_form')
                        .select('id, full_name, email, payment_status, amount, currency, created_at')
                        .eq('promo_code', influencer.promo_code)
                        .order('created_at', { ascending: false });

                    if (signupsError) {
                        console.error('Error fetching signups for influencer:', influencer.promo_code, signupsError);
                        return { ...influencer, signups: [] };
                    }

                    return {
                        ...influencer,
                        signups: signups || []
                    };
                })
            );

            setInfluencers(influencersWithSignups);
        } catch (err: any) {
            console.error('Error fetching admin data:', err);
            setError(err.message || 'Failed to load admin dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: currentAdminData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setCurrentAdmin(currentAdminData);

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

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminSubmitting(true);

        try {
            if (!addAdminForm.name || !addAdminForm.email || !addAdminForm.password) {
                throw new Error('All fields are required');
            }

            if (addAdminForm.password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: addAdminForm.email,
                password: addAdminForm.password,
                options: { data: { full_name: addAdminForm.name } }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create user');

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

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminSubmitting(true);

        try {
            if (!changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
                throw new Error('All fields are required');
            }

            if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
                throw new Error('New passwords do not match');
            }

            if (changePasswordForm.newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters');
            }

            // Directly update user password without requiring current password
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

    const handleAddInfluencer = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);

        try {
            // Validate form
            if (!addInfluencerForm.name || !addInfluencerForm.email || !addInfluencerForm.promoCode) {
                throw new Error('Name, email, and promo code are required');
            }

            // Validate promo code format (uppercase letters and numbers only)
            if (!/^[A-Z0-9]+$/.test(addInfluencerForm.promoCode)) {
                throw new Error('Promo code must contain only uppercase letters and numbers');
            }

            // Check if promo code already exists
            const { data: existingPromo } = await supabase
                .from('influencers')
                .select('promo_code')
                .eq('promo_code', addInfluencerForm.promoCode)
                .single();

            if (existingPromo) {
                throw new Error('This promo code is already in use');
            }

            // Check if user already exists in auth.users (via admin query)
            const { data: existingUsers, error: checkError } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('email', addInfluencerForm.email);

            if (checkError) {
                console.error('Error checking existing user:', checkError);
            }

            let userId: string;
            let isNewUser = false;

            if (existingUsers && existingUsers.length > 0) {
                // User already exists - use their existing ID
                userId = existingUsers[0].id;

                // Check if they're already an influencer
                const { data: existingInfluencer } = await supabase
                    .from('influencers')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                if (existingInfluencer) {
                    throw new Error('This user is already registered as an influencer');
                }

                // Password is not used for existing users
                console.log('Converting existing user to influencer');
            } else {
                // User doesn't exist - create new account
                if (!addInfluencerForm.password) {
                    throw new Error('Password is required for new users');
                }

                if (addInfluencerForm.password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: addInfluencerForm.email,
                    password: addInfluencerForm.password,
                    options: {
                        data: {
                            full_name: addInfluencerForm.name,
                        }
                    }
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error('Failed to create user account');

                userId = authData.user.id;
                isNewUser = true;
            }

            // Create influencer record
            const { error: influencerError } = await supabase
                .from('influencers')
                .insert([{
                    user_id: userId,
                    promo_code: addInfluencerForm.promoCode,
                    name: addInfluencerForm.name,
                    email: addInfluencerForm.email,
                    is_active: true,
                    total_signups: 0,
                    total_paid_signups: 0,
                    total_revenue: 0
                }]);

            if (influencerError) throw influencerError;

            // Success! Reset form and close modal
            setAddInfluencerForm({ name: '', email: '', password: '', promoCode: '' });
            setShowAddModal(false);

            // Refresh the influencers list
            await fetchAdminData();

            if (isNewUser) {
                showToast(`Success! New influencer "${addInfluencerForm.name}" has been created.\n\nLogin credentials:\nEmail: ${addInfluencerForm.email}\nPassword: ${addInfluencerForm.password}\nPromo Code: ${addInfluencerForm.promoCode}\n\nPlease save these credentials!`, 'success');
            } else {
                showToast(`Success! Existing user "${addInfluencerForm.name}" converted to influencer.\n\nEmail: ${addInfluencerForm.email}\nPromo Code: ${addInfluencerForm.promoCode}`, 'success');
            }

        } catch (err: any) {
            console.error('Error creating influencer:', err);
            setSubmitError(err.message || 'Failed to create influencer');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInfluencer || !newPassword) return;

        setPasswordSubmitting(true);
        setPasswordError(null);

        try {
            if (newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            // Call Edge Function to update password
            const { data, error } = await supabase.functions.invoke('admin-update-password', {
                body: {
                    userId: selectedInfluencer.user_id,
                    newPassword: newPassword
                }
            });

            if (error) throw error;

            showToast(`Password updated for ${selectedInfluencer.name}.`, 'success');
            setShowPasswordModal(false);
            setNewPassword('');
            setSelectedInfluencer(null);

        } catch (err: any) {
            console.error('Error resetting password:', err);
            setPasswordError(err.message || 'Failed to reset password');
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const handleMoveSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signupToMove || !targetInfluencerCode) return;

        setMoveSubmitting(true);
        try {
            const { error } = await supabase
                .from('users_by_form')
                .update({ promo_code: targetInfluencerCode })
                .eq('id', signupToMove.id);

            if (error) throw error;

            showToast('User successfully moved to new influencer', 'success');
            setShowMoveModal(false);
            setSignupToMove(null);
            setTargetInfluencerCode('');
            await fetchAdminData();
        } catch (err: any) {
            console.error('Error moving user:', err);
            showToast(err.message || 'Failed to move user', 'error');
        } finally {
            setMoveSubmitting(false);
        }
    };

    const handleDeleteSignup = async (signupId: string) => {
        if (!window.confirm('Are you sure you want to delete this signup? This action cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('users_by_form')
                .delete()
                .eq('id', signupId);

            if (error) throw error;

            showToast('Signup deleted successfully', 'success');
            await fetchAdminData();
        } catch (err: any) {
            console.error('Error deleting signup:', err);
            showToast(err.message || 'Failed to delete signup', 'error');
        }
    };

    const handleAddSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInfluencerForAdd) return;

        setAddSignupSubmitting(true);
        try {
            const { error } = await supabase
                .from('users_by_form')
                .insert([{
                    full_name: newSignup.fullName,
                    email: newSignup.email,
                    amount: newSignup.amount,
                    currency: newSignup.currency,
                    payment_status: newSignup.status,
                    promo_code: selectedInfluencerForAdd.promo_code,
                    user_id: null // Can be linked later if needed
                }]);

            if (error) throw error;

            showToast('New signup added successfully', 'success');
            setShowAddSignupModal(false);
            setNewSignup({
                fullName: '',
                email: '',
                amount: 12.99,
                currency: 'USD',
                status: 'success'
            });
            await fetchAdminData();
        } catch (err: any) {
            console.error('Error adding signup:', err);
            showToast(err.message || 'Failed to add signup', 'error');
        } finally {
            setAddSignupSubmitting(false);
        }
    };

    const handleDeleteInfluencer = async () => {
        if (!influencerToDelete) return;

        setDeleteSubmitting(true);
        try {
            // Delete from influencers table
            const { error } = await supabase
                .from('influencers')
                .delete()
                .eq('id', influencerToDelete.id);

            if (error) throw error;

            showToast(`Influencer ${influencerToDelete.name} has been removed.`, 'success');
            setShowDeleteModal(false);
            setInfluencerToDelete(null);

            // Refresh list
            await fetchAdminData();

        } catch (err: any) {
            console.error('Error deleting influencer:', err);
            showToast(err.message || 'Failed to delete influencer', 'error');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const toggleInfluencer = (id: string) => {
        if (expandedInfluencer === id) {
            setExpandedInfluencer(null);
        } else {
            setExpandedInfluencer(id);
        }
    };

    const openPasswordModal = (influencer: InfluencerStats) => {
        setSelectedInfluencer(influencer);
        setShowPasswordModal(true);
        setNewPassword('');
        setPasswordError(null);
    };

    const openDeleteModal = (influencer: InfluencerStats) => {
        setInfluencerToDelete(influencer);
        setShowDeleteModal(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    // Filter influencers based on search
    const filteredInfluencers = influencers.filter(inf =>
        inf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.promo_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Top Performers (Top 3 by Revenue)
    const topPerformers = [...influencers]
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 3);

    const handleExportCSV = () => {
        const headers = ['Name', 'Email', 'Promo Code', 'Total Signups', 'Paid Signups', 'Revenue', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredInfluencers.map(inf => [
                `"${inf.name}"`,
                inf.email,
                inf.promo_code,
                inf.total_signups,
                inf.total_paid_signups,
                inf.total_revenue.toFixed(2),
                inf.is_active ? 'Active' : 'Inactive'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `influencers_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                    <p className="text-sm text-slate-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                        <p className="text-slate-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate total stats
    const totalRevenue = influencers.reduce((sum, inf) => sum + inf.total_revenue, 0);
    const totalSignups = influencers.reduce((sum, inf) => sum + inf.total_signups, 0);
    const totalPaidSignups = influencers.reduce((sum, inf) => sum + inf.total_paid_signups, 0);

    // Calculate ranks
    const influencerRanks = new Map(
        [...influencers]
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .map((inf, index) => [inf.id, index + 1])
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                                <p className="text-sm text-slate-600">Influencer Management System</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Change Password Button */}
                            <button
                                onClick={() => setShowChangePasswordModal(true)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <Key className="h-4 w-4" />
                                Change Password
                            </button>

                            {/* Add Admin Button */}
                            <button
                                onClick={() => setShowAddAdminModal(true)}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
                            >
                                <UserPlus className="h-4 w-4" />
                                Add Admin
                            </button>

                            {/* View Admins Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowAdminListDropdown(!showAdminListDropdown)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                >
                                    <Shield className="h-4 w-4" />
                                    Admins ({admins.length})
                                    <ChevronDown className="h-4 w-4" />
                                </button>

                                {showAdminListDropdown && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                                        <div className="p-4">
                                            <h3 className="font-semibold text-slate-900 mb-3">All Admins</h3>
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
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
                                            <p className="text-xs text-slate-500 mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                                🔒 To switch admin accounts, please log out and log in with the other admin's credentials.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">



                {/* Overall Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Influencers</p>
                                <h4 className="text-2xl font-bold text-slate-900">{influencers.length}</h4>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Activity className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Signups</p>
                                <h4 className="text-2xl font-bold text-slate-900">{totalSignups}</h4>
                                <p className="text-xs text-slate-500 mt-1">{totalPaidSignups} paid</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                                <h4 className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Influencers List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">All Influencers</h3>
                            <p className="text-sm text-slate-600">Manage and track influencer performance</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Search Bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search influencers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                                />
                                <div className="absolute left-3 top-2.5 text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </div>
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={handleExportCSV}
                                className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                title="Export to CSV"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            </button>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <UserPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">Add Influencer</span>
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-200">
                        {filteredInfluencers.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="h-12 w-12 text-slate-300" />
                                    <p className="text-slate-600 font-medium">
                                        {searchQuery ? 'No influencers found matching your search' : 'No influencers registered yet'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            filteredInfluencers.map((influencer) => (
                                <div key={influencer.id} className="hover:bg-slate-50 transition-colors">
                                    {/* Influencer Header */}
                                    <div className="px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div
                                                onClick={() => toggleInfluencer(influencer.id)}
                                                className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center cursor-pointer"
                                            >
                                                {/* Name & Email */}
                                                <div className="md:col-span-2">
                                                    <div className="flex items-center gap-3">
                                                        {/* Rank Indicator */}
                                                        {influencerRanks.get(influencer.id) && influencerRanks.get(influencer.id)! <= 3 && (
                                                            <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full font-bold text-white text-sm ${influencerRanks.get(influencer.id) === 1 ? 'bg-yellow-500' :
                                                                influencerRanks.get(influencer.id) === 2 ? 'bg-slate-400' : 'bg-orange-700'
                                                                }`}>
                                                                #{influencerRanks.get(influencer.id)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">{influencer.name}</p>
                                                            <p className="text-xs text-slate-600">{influencer.email}</p>
                                                            <div className="mt-1">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                    {influencer.promo_code}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-slate-900">{influencer.total_signups}</p>
                                                    <p className="text-xs text-slate-500">Total Signups</p>
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-green-600">{influencer.total_paid_signups}</p>
                                                    <p className="text-xs text-slate-500">Paid Signups</p>
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-purple-600">${influencer.total_revenue.toFixed(2)}</p>
                                                    <p className="text-xs text-slate-500">Revenue</p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openPasswordModal(influencer);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Reset Password"
                                                >
                                                    <Key className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteModal(influencer);
                                                    }}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove Influencer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>

                                                {/* Expand Icon */}
                                                <div
                                                    onClick={() => toggleInfluencer(influencer.id)}
                                                    className="cursor-pointer p-2"
                                                >
                                                    {expandedInfluencer === influencer.id ? (
                                                        <ChevronUp className="h-5 w-5 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-slate-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Signups Table */}
                                    {expandedInfluencer === influencer.id && (
                                        <div className="px-6 pb-4 bg-slate-50/50">
                                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            User Signups ({influencer.signups.length})
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedInfluencerForAdd(influencer);
                                                                setShowAddSignupModal(true);
                                                            }}
                                                            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <UserPlus className="h-3 w-3" />
                                                            Add Signup
                                                        </button>
                                                    </div>
                                                </div>

                                                {influencer.signups.length === 0 ? (
                                                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                                                        No signups yet for this influencer
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                                                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200">
                                                                {influencer.signups.map((signup) => (
                                                                    <tr key={signup.id} className="hover:bg-slate-50">
                                                                        <td className="px-4 py-3 whitespace-nowrap text-slate-900">
                                                                            {signup.full_name}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                                                            {signup.email}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                        ${signup.payment_status === 'success' ? 'bg-green-100 text-green-800' : ''}
                                        ${signup.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        ${signup.payment_status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                                      `}>
                                                                                {signup.payment_status || 'N/A'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                                                            {signup.amount && signup.currency ? (
                                                                                <>
                                                                                    {signup.currency === 'USD' ? '$' : signup.currency === 'EUR' ? '€' : '£'}
                                                                                    {signup.amount.toFixed(2)}
                                                                                </>
                                                                            ) : (
                                                                                'N/A'
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                                                            {new Date(signup.created_at).toLocaleDateString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                year: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSignupToMove(signup);
                                                                                        setTargetInfluencerCode(influencer.promo_code); // Default to current
                                                                                        setShowMoveModal(true);
                                                                                    }}
                                                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                                                    title="Move to another influencer"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteSignup(signup.id)}
                                                                                    className="text-red-600 hover:text-red-800 p-1"
                                                                                    title="Delete signup"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Add Influencer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <UserPlus className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Add New Influencer</h2>
                                    <p className="text-sm text-slate-600">Create account and set promo code</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSubmitError(null);
                                    setAddInfluencerForm({ name: '', email: '', password: '', promoCode: '' });
                                }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleAddInfluencer} className="p-6 space-y-4">
                            {submitError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-700">{submitError}</p>
                                </div>
                            )}

                            {/* Name Field */}
                            <div>
                                <label htmlFor="influencer-name" className="block text-sm font-medium text-slate-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="influencer-name"
                                    type="text"
                                    value={addInfluencerForm.name}
                                    onChange={(e) => setAddInfluencerForm({ ...addInfluencerForm, name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="influencer-email" className="block text-sm font-medium text-slate-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="influencer-email"
                                    type="email"
                                    value={addInfluencerForm.email}
                                    onChange={(e) => setAddInfluencerForm({ ...addInfluencerForm, email: e.target.value })}
                                    placeholder="john@example.com"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="influencer-password" className="block text-sm font-medium text-slate-700 mb-1">
                                    Password <span className="text-slate-400">(optional)</span>
                                </label>
                                <input
                                    id="influencer-password"
                                    type="password"
                                    value={addInfluencerForm.password}
                                    onChange={(e) => setAddInfluencerForm({ ...addInfluencerForm, password: e.target.value })}
                                    placeholder="Only needed for new users"
                                    minLength={6}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Required for new users (min 6 chars). Leave blank if user already exists.
                                </p>
                            </div>

                            {/* Promo Code Field */}
                            <div>
                                <label htmlFor="influencer-promo" className="block text-sm font-medium text-slate-700 mb-1">
                                    Promo Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="influencer-promo"
                                    type="text"
                                    value={addInfluencerForm.promoCode}
                                    onChange={(e) => setAddInfluencerForm({ ...addInfluencerForm, promoCode: e.target.value.toUpperCase() })}
                                    placeholder="JOHN2024"
                                    required
                                    pattern="[A-Z0-9]+"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                                />
                                <p className="text-xs text-slate-500 mt-1">Uppercase letters and numbers only (e.g., JOHN2024)</p>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                                <p className="text-xs text-blue-700">
                                    <strong>📝 Two Options:</strong>
                                </p>
                                <p className="text-xs text-blue-700">
                                    • <strong>New User:</strong> Fill all fields including password. A new account will be created.
                                </p>
                                <p className="text-xs text-blue-700">
                                    • <strong>Existing User:</strong> Enter their email (skip password). They'll become an influencer with their existing login.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setSubmitError(null);
                                        setAddInfluencerForm({ name: '', email: '', password: '', promoCode: '' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Creating...' : 'Create Influencer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Move User Modal */}
            {showMoveModal && signupToMove && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Move User</h2>
                            <button onClick={() => setShowMoveModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleMoveSignup} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Moving <strong>{signupToMove.full_name}</strong> ({signupToMove.email})
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select New Influencer</label>
                                <select
                                    value={targetInfluencerCode}
                                    onChange={(e) => setTargetInfluencerCode(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    required
                                >
                                    <option value="">Select Influencer</option>
                                    {influencers.map(inf => (
                                        <option key={inf.id} value={inf.promo_code}>
                                            {inf.name} ({inf.promo_code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={moveSubmitting}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {moveSubmitting ? 'Moving...' : 'Move User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Signup Modal */}
            {showAddSignupModal && selectedInfluencerForAdd && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Add Manual Signup</h2>
                            <button onClick={() => setShowAddSignupModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleAddSignup} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={newSignup.fullName}
                                    onChange={(e) => setNewSignup({ ...newSignup, fullName: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newSignup.email}
                                    onChange={(e) => setNewSignup({ ...newSignup, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newSignup.amount}
                                        onChange={(e) => setNewSignup({ ...newSignup, amount: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                                    <select
                                        value={newSignup.currency}
                                        onChange={(e) => setNewSignup({ ...newSignup, currency: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="GBP">GBP</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={newSignup.status}
                                    onChange={(e) => setNewSignup({ ...newSignup, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="success">Success</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={addSignupSubmitting}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {addSignupSubmitting ? 'Adding...' : 'Add Signup'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordModal && selectedInfluencer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Key className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
                                    <p className="text-sm text-slate-600">{selectedInfluencer.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordError(null);
                                    setNewPassword('');
                                }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handlePasswordReset} className="p-6 space-y-4">
                            {passwordError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-700">{passwordError}</p>
                                </div>
                            )}

                            {/* Password Input Field */}
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="new-password"
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoComplete="off"
                                />
                                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-sm text-amber-800 mb-2">
                                    <strong>⚠️ Important</strong>
                                </p>
                                <p className="text-xs text-amber-700">
                                    After setting the password, you'll need to manually share it with:
                                </p>
                                <p className="text-sm font-semibold text-amber-900 mt-1">
                                    {selectedInfluencer.email}
                                </p>
                                <p className="text-xs text-amber-700 mt-2">
                                    The password will be displayed so you can securely share it with the influencer.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordError(null);
                                        setNewPassword('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                    disabled={passwordSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordSubmitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {passwordSubmitting ? 'Setting...' : 'Set Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && influencerToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Trash2 className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Remove Influencer</h2>
                                    <p className="text-sm text-slate-600">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-sm text-amber-800 mb-2">
                                    <strong>⚠️ Warning</strong>
                                </p>
                                <p className="text-sm text-amber-700">
                                    You are about to remove <strong>{influencerToDelete.name}</strong> as an influencer.
                                </p>
                                <div className="mt-3 pt-3 border-t border-amber-200 space-y-1">
                                    <p className="text-xs text-amber-600">
                                        • Promo code: <strong>{influencerToDelete.promo_code}</strong>
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        • Total Signups: <strong>{influencerToDelete.total_signups}</strong>
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        • Revenue: <strong>${influencerToDelete.total_revenue.toFixed(2)}</strong>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <p className="text-xs text-slate-600">
                                    <strong>Note:</strong> This will only remove their influencer status.
                                    Their user account will remain active, and existing signup records will be preserved.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setInfluencerToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                    disabled={deleteSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteInfluencer}
                                    disabled={deleteSubmitting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleteSubmitting ? 'Removing...' : 'Remove Influencer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
                            <button onClick={() => setShowChangePasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-blue-800">
                                    Changing password for: <strong>{currentAdmin?.email}</strong>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={changePasswordForm.newPassword}
                                    onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={adminSubmitting}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {adminSubmitting ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Admin Modal */}
            {showAddAdminModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Add New Admin</h2>
                            <button onClick={() => setShowAddAdminModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={addAdminForm.name}
                                    onChange={(e) => setAddAdminForm({ ...addAdminForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={addAdminForm.email}
                                    onChange={(e) => setAddAdminForm({ ...addAdminForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={addAdminForm.password}
                                    onChange={(e) => setAddAdminForm({ ...addAdminForm, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                    minLength={6}
                                />
                                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                            </div>
                            <button
                                type="submit"
                                disabled={adminSubmitting}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {adminSubmitting ? 'Creating...' : 'Create Admin'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
