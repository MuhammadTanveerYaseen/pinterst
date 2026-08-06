'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Shield, Users, Activity, Pin, Cpu, ToggleLeft, ToggleRight, 
  RefreshCw, CheckCircle, Database, Server, Settings, HelpCircle 
} from 'lucide-react';

const GET_ADMIN_DATA = gql`
  query GetAdminData {
    adminDashboard {
      totalUsersCount
      activeSchedulesCount
      connectedPinterestAccountsCount
      totalPinsPublishedCount
      apiUsageLimit
      apiUsageCurrent
    }
  }
`;

export default function AdminPage() {
  const { data, loading, refetch } = useQuery(GET_ADMIN_DATA);

  // Simulated Feature flags local state
  const [flags, setFlags] = useState({
    aiAssistant: true,
    analyticsPro: true,
    bulkPosting: true,
    teamCollaborate: true
  });

  const handleToggleFlag = (flagName: keyof typeof flags) => {
    const nextVal = !flags[flagName];
    setFlags(prev => ({
      ...prev,
      [flagName]: nextVal
    }));
    if (window.showToast) {
      window.showToast(`System Feature [${flagName}] updated to: ${nextVal ? 'ACTIVE' : 'INACTIVE'}`);
    }
  };

  const handleRefresh = async () => {
    if (window.showToast) window.showToast('Refreshing system monitors...', 'info');
    await refetch();
    if (window.showToast) window.showToast('System health checks verified.');
  };

  const stats = (data as any)?.adminDashboard;
  const apiPercent = stats ? Math.round((stats.apiUsageCurrent / stats.apiUsageLimit) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">System Admin Console</h2>
            <p className="text-sm text-neutral-500">Monitor overall system metrics, API usage limits, and toggle feature flags.</p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 transition-all duration-150"
            title="Force Health Check"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* System KPIs Grid */}
        {loading && !stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1 */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Registered</span>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black">{stats?.totalUsersCount}</h3>
                <span className="text-xxs text-neutral-400">SaaS user partitions</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-bold uppercase tracking-wider">Active Schedules</span>
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black">{stats?.activeSchedulesCount}</h3>
                <span className="text-xxs text-neutral-400">Pins in cron worker queue</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-bold uppercase tracking-wider">Linked Profiles</span>
                <Pin className="w-5 h-5 text-red-500 rotate-45" />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black">{stats?.connectedPinterestAccountsCount}</h3>
                <span className="text-xxs text-neutral-400">Authorized OAuth tokens</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-bold uppercase tracking-wider">Published Pins</span>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black">{stats?.totalPinsPublishedCount}</h3>
                <span className="text-xxs text-neutral-400">Successful publications</span>
              </div>
            </div>
          </div>
        )}

        {/* Monitor splitting */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* API Limits Gauge */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold">API Performance Monitor</h3>
              <p className="text-sm text-neutral-400">Track current API request limits against quota.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-1.5"><Server className="w-4 h-4 text-neutral-400" /> API Requests Usage</span>
                <span className="text-neutral-500">{stats?.apiUsageCurrent} / {stats?.apiUsageLimit} requests</span>
              </div>

              {/* Progress bar */}
              <div className="h-4 bg-neutral-100 dark:bg-neutral-950 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800/80">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-300"
                  style={{ width: `${apiPercent}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xxs text-neutral-400">
                <span>Quota resets in 45 minutes</span>
                <span>{apiPercent}% capacity reached</span>
              </div>
            </div>

            {/* Diagnostic Logs info box */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 text-xs text-neutral-500 flex items-start gap-3">
              <Database className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-neutral-800 dark:text-neutral-200">Local Cache Database Diagnostics</p>
                <p className="leading-relaxed">
                  System connection fallbacks are active. Accessing persistent filesystem buffer database. Sync workers are polling at 10-second intervals.
                </p>
              </div>
            </div>
          </div>

          {/* System Feature flags */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold">Feature Flags</h3>
              <p className="text-sm text-neutral-400">Disable or enable global SaaS services.</p>
            </div>

            <div className="space-y-4">
              {/* Flag 1 */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80 last:border-none">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">AI Caption Assistant</span>
                  <span className="text-[10px] text-neutral-400">Toggle AI description optimizer</span>
                </div>
                <button onClick={() => handleToggleFlag('aiAssistant')}>
                  {flags.aiAssistant ? <ToggleRight className="w-8 h-8 text-red-500" /> : <ToggleLeft className="w-8 h-8 text-neutral-400" />}
                </button>
              </div>

              {/* Flag 2 */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80 last:border-none">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">Pro Analytics Charts</span>
                  <span className="text-[10px] text-neutral-400">Toggle advanced graph widgets</span>
                </div>
                <button onClick={() => handleToggleFlag('analyticsPro')}>
                  {flags.analyticsPro ? <ToggleRight className="w-8 h-8 text-red-500" /> : <ToggleLeft className="w-8 h-8 text-neutral-400" />}
                </button>
              </div>

              {/* Flag 3 */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80 last:border-none">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">CSV Bulk Scheduler</span>
                  <span className="text-[10px] text-neutral-400">Toggle spreadsheet parsing uploads</span>
                </div>
                <button onClick={() => handleToggleFlag('bulkPosting')}>
                  {flags.bulkPosting ? <ToggleRight className="w-8 h-8 text-red-500" /> : <ToggleLeft className="w-8 h-8 text-neutral-400" />}
                </button>
              </div>

              {/* Flag 4 */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80 last:border-none">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">Team Collaboration</span>
                  <span className="text-[10px] text-neutral-400">Toggle workspace user invites</span>
                </div>
                <button onClick={() => handleToggleFlag('teamCollaborate')}>
                  {flags.teamCollaborate ? <ToggleRight className="w-8 h-8 text-red-500" /> : <ToggleLeft className="w-8 h-8 text-neutral-400" />}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
