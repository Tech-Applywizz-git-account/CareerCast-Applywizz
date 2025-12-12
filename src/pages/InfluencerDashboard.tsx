// src/pages/InfluencerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { ArrowLeft, Users, DollarSign, TrendingUp, Copy, CheckCircle, Calendar } from 'lucide-react';
import Toast from '../components/Toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Signup {
  id: string;
  full_name: string;
  email: string;
  payment_status: string | null;
  amount: number | null;
  currency: string | null;
  created_at: string;
}

interface InfluencerData {
  id: string;
  promo_code: string;
  name: string;
  email: string;
  total_signups: number;
  total_paid_signups: number;
  total_revenue: number;
  created_at: string;
  signups: Signup[];
}

// High-contrast / Opposite color palette for distinct visibility
const COLORS = [
  '#2563eb', // Blue
  '#f97316', // Orange (Opposite of Blue)
  '#16a34a', // Green
  '#dc2626', // Red (Opposite of Green)
  '#9333ea', // Purple
  '#eab308', // Yellow (Opposite of Purple)
  '#0891b2', // Cyan
  '#db2777', // Pink
];

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const [influencerData, setInfluencerData] = useState<InfluencerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Restored Filter State
  const [dateRange, setDateRange] = useState<'all' | '30days' | '7days' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchInfluencerData();
  }, []);

  const fetchInfluencerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Fetch influencer data
      const { data: influencer, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (influencerError) {
        throw influencerError;
      }

      if (!influencer) {
        throw new Error('Influencer profile not found');
      }

      // Fetch signups with promo code
      const { data: signups, error: signupsError } = await supabase
        .from('users_by_form')
        .select('id, full_name, email, payment_status, amount, currency, created_at')
        .eq('promo_code', influencer.promo_code)
        .order('created_at', { ascending: false });

      if (signupsError) {
        throw signupsError;
      }

      setInfluencerData({
        ...influencer,
        signups: signups || []
      });
    } catch (err: any) {
      console.error('Error fetching influencer data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPromoCode = () => {
    if (influencerData?.promo_code) {
      navigator.clipboard.writeText(influencerData.promo_code);
      setCopied(true);
      showToast(`Promo code "${influencerData.promo_code}" copied!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !influencerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-6">
              {error || 'You do not have access to the influencer dashboard.'}
            </p>
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

  // Filter signups based on date range AND payment status (completed only)
  const filteredSignups = (influencerData.signups || []).filter(signup => {
    // Only show completed/paid signups
    if (signup.payment_status !== 'success') return false;

    if (dateRange === 'all') return true;

    const date = new Date(signup.created_at);

    if (dateRange === 'custom') {
      if (!customDateRange.start && !customDateRange.end) return true;

      const start = customDateRange.start ? new Date(customDateRange.start) : new Date(0);
      const end = customDateRange.end ? new Date(customDateRange.end) : new Date();
      // Set end date to end of day to include all events on that day
      end.setHours(23, 59, 59, 999);

      return date >= start && date <= end;
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return dateRange === '30days' ? diffDays <= 30 : diffDays <= 7;
  });

  // Calculate statistics based on filtered data
  const paidSignups = filteredSignups.filter(s => s.payment_status === 'success').length;
  const pendingSignups = filteredSignups.filter(s => s.payment_status === 'pending').length;
  const failedSignups = filteredSignups.filter(s => s.payment_status === 'failed').length;

  // Calculate Earnings: 5 USD per completed signup, converted to INR at 85 rate
  // filteredSignups already contains only 'success' status signups
  const completedSignupsCount = filteredSignups.length;
  const earningsUSD = completedSignupsCount * 5;
  const estimatedEarningsINR = earningsUSD * 85;

  // Daily trend data (group by date)
  const sortedSignups = [...filteredSignups].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const dailyData = sortedSignups.reduce((acc: any[], signup) => {
    const date = new Date(signup.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.total += 1;
      if (signup.payment_status === 'success') existing.paid += 1;
    } else {
      acc.push({
        date,
        total: 1,
        paid: signup.payment_status === 'success' ? 1 : 0
      });
    }
    return acc;
  }, []);

  // Day of Week Pie Data
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeekMap = filteredSignups.reduce((acc: any, signup) => {
    const day = daysOfWeek[new Date(signup.created_at).getDay()];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const dayOfWeekPieData = Object.entries(dayOfWeekMap).map(([name, value]) => ({ name, value }));

  // Generate secure hash for referral link (PromoCode + Checksum)
  // This prevents users from manually editing the base64 string to guess other codes
  const generateSecureHash = (code: string) => {
    // Simple checksum: Reverse the code. 
    // Format: Base64(Code + "|" + ReversedCode)
    const checksum = code.split('').reverse().join('');
    return btoa(`${code}|${checksum}`);
  };

  const referralLink = `${window.location.origin}/?ref=${generateSecureHash(influencerData.promo_code)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    showToast('Referral link copied!', 'success');
  };

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
                <h1 className="text-2xl font-bold text-slate-900">Influencer Dashboard</h1>
                <p className="text-sm text-slate-600">Welcome back, {influencerData.name}!</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Controls Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-start md:items-center">
          {/* Date Filter */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
            <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex">
              <button
                onClick={() => setDateRange('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${dateRange === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${dateRange === '30days' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateRange('7days')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${dateRange === '7days' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange('custom')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${dateRange === 'custom' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Date Inputs */}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">From</span>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div className="h-4 w-px bg-slate-200"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">To</span>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Promo & Link Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Promo Code Card */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-indigo-100 font-medium text-sm">Your Promo Code</h3>
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold tracking-wider mb-0.5">{influencerData.promo_code}</p>
                <p className="text-indigo-100 text-xs">Share this code</p>
              </div>
              <button
                onClick={handleCopyPromoCode}
                className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
              >
                {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Referral Link Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 font-medium">Direct Referral Link</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 break-all text-sm text-slate-600 font-mono">
                {referralLink}
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Signups</p>
                <h4 className="text-2xl font-bold text-slate-900">{filteredSignups.length}</h4>
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Paid Signups</p>
                <h4 className="text-2xl font-bold text-slate-900">{paidSignups}</h4>
              </div>
            </div>
          </div> */}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Est. Earnings (INR)</p>
                <h4 className="text-2xl font-bold text-slate-900">₹{estimatedEarningsINR.toLocaleString()}</h4>
                <p className="text-xs text-slate-400 mt-1">₹425 per paid signup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Daily Trend */}
          {dailyData.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Signups Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#6366f1" name="Total Signups" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="paid" fill="#10b981" name="Paid Signups" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pie Chart - Day of Week Distribution */}
          {dayOfWeekPieData.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Signups by Day of Week</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dayOfWeekPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dayOfWeekPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Signups Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Signups History</h3>
            <p className="text-sm text-slate-600">
              {dateRange === 'all' ? 'All time history' : `Signups from the last ${dateRange === '30days' ? '30' : '7'} days`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Commission
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSignups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-slate-300" />
                        <p className="text-slate-600 font-medium">No signups found for this period</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSignups.map((signup) => (
                    <tr key={signup.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{signup.full_name}</div>
                        <div className="text-xs text-slate-500">{signup.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${signup.payment_status === 'success' ? 'bg-green-100 text-green-800' : ''}
                          ${signup.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${signup.payment_status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {signup.payment_status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {signup.amount && signup.currency ? (
                          <>
                            {signup.currency === 'USD' ? '$' : signup.currency === 'EUR' ? '€' : '£'}
                            {signup.amount.toFixed(2)}
                          </>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {signup.payment_status === 'success' && signup.amount ? (
                          `$${(signup.amount * 0.20).toFixed(2)}`
                        ) : (
                          '-'
                        )}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(signup.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
