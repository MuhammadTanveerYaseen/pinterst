'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Users, BarChart3, FolderHeart, Calendar, Heart, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Pin, Plus, CalendarDays, ExternalLink, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const DASHBOARD_DATA = gql`
  query GetDashboardData($range: String!) {
    me {
      id
      name
      role
    }
    pinterestAccounts {
      id
      username
      profileImage
      followers
      following
      boardsCount
      monthlyViews
      status
    }
    pins(status: "scheduled") {
      id
      title
      mediaUrl
      scheduledAt
      accountIds
      status
    }
    analytics(range: $range) {
      performanceData {
        date
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
    activityLogs(limit: 5) {
      id
      action
      details
      accountUsername
      timestamp
      status
    }
  }
`;

export default function DashboardPage() {
  const [range, setRange] = useState('30d');
  
  const { data, loading, error, refetch } = useQuery(DASHBOARD_DATA, {
    variables: { range },
    notifyOnNetworkStatusChange: true,
  });

  const handleRefresh = async () => {
    if (window.showToast) window.showToast('Syncing account data...', 'info');
    await refetch();
    if (window.showToast) window.showToast('Data synced successfully!');
  };

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
            <div className="h-10 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
          </div>
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl animate-pulse"></div>
            ))}
          </div>
          {/* Chart Skeleton */}
          <div className="h-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl animate-pulse"></div>
        </div>
      </DashboardLayout>
    );
  }

  const accounts = (data as any)?.pinterestAccounts || [];
  const scheduledPins = (data as any)?.pins || [];
  const logs = (data as any)?.activityLogs || [];
  const analyticsResult = (data as any)?.analytics;
  const growth = analyticsResult?.growthSummary;
  const chartData = analyticsResult?.performanceData || [];

  // Calculate totals
  const totalFollowers = accounts.reduce((acc: number, curr: any) => acc + curr.followers, 0);
  const totalBoards = accounts.reduce((acc: number, curr: any) => acc + curr.boardsCount, 0);
  const totalMonthlyViews = accounts.reduce((acc: number, curr: any) => acc + curr.monthlyViews, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Welcome, {(data as any)?.me?.name || 'User'}</h2>
            <p className="text-sm text-neutral-500">Here is what is happening across your Pinterest network.</p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
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
              onClick={handleRefresh}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 transition-all duration-150"
              title="Sync Accounts"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty State */}
        {accounts.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mb-2">
              <Pin className="w-9 h-9 rotate-45" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Connect your Pinterest Account</h3>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                Pinterest Hub allows you to schedule pins, cross-post, and view combined growth analytics. Link your first account to get started.
              </p>
            </div>
            <Link
              href="/accounts"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-6 rounded-2xl hover:opacity-95 shadow-md shadow-red-600/10 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              Link Pinterest Account
            </Link>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-400">Total Followers</span>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-2xl font-black">{totalFollowers.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+{growth?.followersGrowth || 120} this week</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-400">Monthly Impressions</span>
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-2xl font-black">{totalMonthlyViews.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+{growth?.impressionsGrowthPercent || '12.4'}% growth</span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-400">Connected Boards</span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <FolderHeart className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-2xl font-black">{totalBoards}</h3>
                  <span className="text-xs text-neutral-400">Across {accounts.length} profile{accounts.length > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-400">Scheduled Queue</span>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-2xl font-black">{scheduledPins.length}</h3>
                  <span className="text-xs text-neutral-400">Pins in scheduled buffer</span>
                </div>
              </div>
            </div>

            {/* Performance Analytics Chart */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold">Impressions Performance</h3>
                  <p className="text-sm text-neutral-400">Visual impressions trend over the selected time range.</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>Impressions</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Outbound Clicks</span>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e60023" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#e60023" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="impressions" stroke="#e60023" strokeWidth={3} fillOpacity={1} fill="url(#colorImpressions)" />
                    <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Queue List widget */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm lg:col-span-2 flex flex-col">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-lg font-bold">Upcoming Pin Buffer</h3>
                    <p className="text-sm text-neutral-400">Next scheduled pins in queue</p>
                  </div>
                  <Link href="/scheduler" className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1.5">
                    Schedule Pin
                    <Plus className="w-3.5 h-3.5" />
                  </Link>
                </div>
                
                <div className="flex-1 space-y-4">
                  {scheduledPins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-400 text-sm gap-2">
                      <CalendarDays className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                      <span>No pins scheduled in queue</span>
                    </div>
                  ) : (
                    scheduledPins.slice(0, 4).map((pin: any) => {
                      const date = new Date(pin.scheduledAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      return (
                        <div key={pin.id} className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 transition-colors">
                          <img
                            src={pin.mediaUrl}
                            alt={pin.title}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate leading-tight">{pin.title}</h4>
                            <span className="text-xs text-neutral-400 mt-1 block">{date}</span>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xxs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 capitalize">
                            {pin.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Activity Log widget */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-lg font-bold">Activity Log</h3>
                    <p className="text-sm text-neutral-400">Recent workspace actions</p>
                  </div>
                  <Link href="/logs" className="text-xs font-semibold text-neutral-400 hover:text-neutral-500 flex items-center gap-1">
                    View All
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                
                <div className="flex-1 space-y-4">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-48 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-400 text-sm">
                      No logs recorded
                    </div>
                  ) : (
                    logs.map((log: any) => {
                      const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={log.id} className="text-xs flex flex-col gap-1 py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-none">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 capitalize">
                              {log.action.replace('_', ' ')}
                            </span>
                            <span className="text-xxs text-neutral-400">{time}</span>
                          </div>
                          <p className="text-neutral-500 leading-normal truncate">{log.details}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
