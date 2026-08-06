'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  BarChart3, Calendar, Users, Eye, MousePointerClick, Heart, 
  ArrowUpRight, RefreshCw, Layers, TrendingUp, HelpCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

const GET_ANALYTICS = gql`
  query GetAnalyticsData($range: String!) {
    pinterestAccounts {
      id
      username
      followers
      monthlyViews
      profileImage
    }
    analytics(range: $range) {
      performanceData {
        date
        impressions
        saves
        clicks
      }
      topBoards {
        name
        impressions
        saves
        clicks
      }
      growthSummary {
        totalImpressions
        totalSaves
        totalClicks
        impressionsGrowthPercent
        savesGrowthPercent
        clicksGrowthPercent
        followersGrowth
      }
    }
  }
`;

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  const { data, loading, refetch } = useQuery(GET_ANALYTICS, {
    variables: { range }
  });

  const handleSync = async () => {
    if (window.showToast) window.showToast('Fetching latest Pinterest statistics...', 'info');
    await refetch();
    if (window.showToast) window.showToast('Statistics successfully synced.');
  };

  const accounts = (data as any)?.pinterestAccounts || [];
  const analytics = (data as any)?.analytics;
  const chartData = analytics?.performanceData || [];
  const topBoards = analytics?.topBoards || [];
  const growth = analytics?.growthSummary;

  // Build account comparison data for chart
  const accountCompareData = accounts.map((acc: any) => ({
    username: acc.username.slice(0, 10),
    Followers: acc.followers,
    Impressions: acc.monthlyViews
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Growth Analytics</h2>
            <p className="text-sm text-neutral-500">Track visual impressions, click rates, and board conversions.</p>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Account Selector */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="all">All Profiles Combined</option>
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>@{acc.username}</option>
              ))}
            </select>

            {/* Range Select */}
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            <button
              onClick={handleSync}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 transition-all duration-150"
              title="Sync Stats"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
            <h3 className="text-xl font-bold">No Data Available</h3>
            <p className="text-neutral-500 text-sm">Link at least one Pinterest account to track and analyze growth charts.</p>
          </div>
        ) : (
          <>
            {/* Metric widgets cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center text-neutral-400">
                  <span className="text-sm font-semibold">Aggregate Impressions</span>
                  <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black">{growth?.totalImpressions.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+{growth?.impressionsGrowthPercent}% growth</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center text-neutral-400">
                  <span className="text-sm font-semibold">Outbound Link Clicks</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <MousePointerClick className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black">{growth?.totalClicks.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+{growth?.clicksGrowthPercent}% growth</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center text-neutral-400">
                  <span className="text-sm font-semibold">Total Saves & Repins</span>
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Heart className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black">{growth?.totalSaves.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+{growth?.savesGrowthPercent}% growth</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance charts area */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold">Pinterest Network Trend</h3>
                <p className="text-sm text-neutral-400">Daily performance charting impressions against click activity.</p>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartImp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e60023" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#e60023" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="chartClick" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-neutral-800"/>
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(23, 23, 23, 0.95)', 
                        borderColor: '#262626', 
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px'
                      }} 
                    />
                    <Area type="monotone" dataKey="impressions" stroke="#e60023" strokeWidth={3} fillOpacity={1} fill="url(#chartImp)" />
                    <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Split layout grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Profile Comparison Chart */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Compare Accounts</h3>
                  <p className="text-sm text-neutral-400">Side-by-side follower and monthly views comparison.</p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accountCompareData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-neutral-800"/>
                      <XAxis dataKey="username" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(23, 23, 23, 0.95)', 
                          borderColor: '#262626', 
                          borderRadius: '16px',
                          color: '#fff'
                        }} 
                      />
                      <Legend fontSize={10} />
                      <Bar dataKey="Followers" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Impressions" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Performing Boards Table */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold">Top Performing Boards</h3>
                  <p className="text-sm text-neutral-400">Boards sorted by visual reach and click conversions.</p>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Board Name</th>
                        <th className="pb-3 text-right">Impressions</th>
                        <th className="pb-3 text-right">Outbound Clicks</th>
                        <th className="pb-3 text-right">Saves</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {topBoards.map((board: any, idx: number) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-950/30 transition-colors">
                          <td className="py-3.5 font-semibold text-neutral-800 dark:text-neutral-200">
                            {board.name}
                          </td>
                          <td className="py-3.5 text-right font-semibold">{board.impressions.toLocaleString()}</td>
                          <td className="py-3.5 text-right text-emerald-500 font-bold">{board.clicks.toLocaleString()}</td>
                          <td className="py-3.5 text-right font-semibold">{board.saves.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
