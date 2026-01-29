import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Influencer Dashboard Component
 * 
 * This component fetches and displays comprehensive influencer data
 * using the /api/influencer-data endpoint
 * 
 * Usage:
 * <InfluencerDataDashboard influencerEmail="influencer@example.com" />
 */

// Type definitions
interface InfluencerProfile {
    id: string;
    name: string;
    email: string;
    promo_code: string;
    affiliate_link: string;
    direct_referral_link: string;
    account_status: string;
    member_since: string;
    last_updated: string;
}

interface Statistics {
    total_signups: number;
    total_paid_signups: number;
    total_free_signups: number;
    conversion_rate: string;
}

interface FinancialSummary {
    total_revenue_generated: {
        amount: number;
        currency: string;
        formatted: string;
    };
    influencer_earnings: {
        amount: number;
        currency: string;
        formatted: string;
        commission_rate: string;
    };
    platform_expenses: {
        amount: number;
        currency: string;
        formatted: string;
    };
    average_order_value: {
        amount: number;
        currency: string;
        formatted: string;
    };
}

interface Purchase {
    purchase_id: string;
    user_details: {
        full_name: string;
        email: string;
        phone: string;
        country: string;
    };
    purchase_info: {
        payment_status: string;
        amount: number;
        currency: string;
        promo_code_used: string;
    };
    timestamps: {
        purchase_date: string;
        purchase_time: string;
        purchase_datetime_iso: string;
        updated_at: string;
    };
    additional_info: {
        transaction_id: string;
        payment_method: string;
    };
}

interface InfluencerData {
    success: boolean;
    timestamp: string;
    influencer_profile: InfluencerProfile;
    statistics: Statistics;
    financial_summary: FinancialSummary;
    all_purchases: Purchase[];
    purchases_breakdown: {
        total_purchases: number;
        paid_purchases_count: number;
        unpaid_purchases_count: number;
        paid_purchases: Purchase[];
        unpaid_purchases: Purchase[];
    };
    dashboard_data: {
        daily_signups_trend: {
            paid_signups: number;
            total_signups: number;
        };
        recent_activity: Purchase[];
    };
}

interface InfluencerDataDashboardProps {
    influencerEmail: string;
}

const InfluencerDataDashboard: React.FC<InfluencerDataDashboardProps> = ({ influencerEmail }) => {
    const [data, setData] = useState<InfluencerData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchInfluencerData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [influencerEmail]);

    const fetchInfluencerData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/influencer-data?email=${influencerEmail}`);
            const result = await response.json();

            if (result.success) {
                setData(result);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to fetch influencer data. Please try again.');
            console.error('Error fetching influencer data:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchInfluencerData}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { influencer_profile, statistics, financial_summary, all_purchases } = data;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Influencer Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back, {influencer_profile.name}!</p>
                    </div>
                    <button
                        onClick={() => navigate('/logout')}
                        className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Signups */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Signups</p>
                            <p className="text-2xl font-bold text-gray-900">{statistics.total_signups}</p>
                        </div>
                    </div>
                </div>

                {/* Earnings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Earnings ({financial_summary.influencer_earnings.currency})</p>
                            <p className="text-2xl font-bold text-green-600">
                                {financial_summary.influencer_earnings.formatted}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Paid Signups */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Paid Signups</p>
                            <p className="text-2xl font-bold text-gray-900">{statistics.total_paid_signups}</p>
                        </div>
                    </div>
                </div>

                {/* Conversion Rate */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Conversion Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{statistics.conversion_rate}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Referral Link Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Direct Referral Link</h2>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={influencer_profile.affiliate_link}
                        readOnly
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                    <button
                        onClick={() => copyToClipboard(influencer_profile.affiliate_link)}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        {copied ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Link
                            </>
                        )}
                    </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    Promo Code: <span className="font-semibold text-purple-600">{influencer_profile.promo_code}</span>
                </p>
            </div>

            {/* Signups History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Signups History</h2>
                    <p className="text-sm text-gray-600 mt-1">All time history</p>
                </div>

                {all_purchases.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-gray-600 font-medium">No signups yet</p>
                        <p className="text-sm text-gray-500 mt-1">Share your referral link to start earning!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {all_purchases.map((purchase) => (
                                    <tr key={purchase.purchase_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {purchase.user_details.full_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {purchase.user_details.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${purchase.purchase_info.payment_status === 'success'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {purchase.purchase_info.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {purchase.purchase_info.currency} {purchase.purchase_info.amount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {purchase.timestamps.purchase_date}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {purchase.timestamps.purchase_time}
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
    );
};

export default InfluencerDataDashboard;
