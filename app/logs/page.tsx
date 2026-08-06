'use client';

import React from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import DashboardLayout from '../../components/DashboardLayout';
import { History, ShieldAlert, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

const GET_LOGS = gql`
  query GetLogs {
    activityLogs {
      id
      action
      details
      accountUsername
      timestamp
      status
    }
  }
`;

export default function LogsPage() {
  const { data, loading, refetch } = useQuery(GET_LOGS);

  const handleRefresh = async () => {
    if (window.showToast) window.showToast('Refreshing activity logs...', 'info');
    await refetch();
    if (window.showToast) window.showToast('Audit trail refreshed.');
  };

  const logs = (data as any)?.activityLogs || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Activity Logs</h2>
            <p className="text-sm text-neutral-500">Audit trail of logins, scheduled posts, and background queues.</p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 transition-all duration-150"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Audit Table */}
        {loading && logs.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl h-96 animate-pulse"></div>
        ) : logs.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-850 text-neutral-400 mb-2">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">No Records Found</h3>
            <p className="text-neutral-500 text-sm">Any schedule publishings, OAuth updates, and edits will appear here in chronological order.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Action</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Profile</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {logs.map((log: any) => {
                    const time = new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    return (
                      <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-950/30 transition-colors">
                        <td className="p-4 pl-6 font-bold text-neutral-800 dark:text-neutral-200 capitalize">
                          {log.action.replace('_', ' ')}
                        </td>
                        <td className="p-4 text-neutral-500 max-w-xs md:max-w-md truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="p-4 text-neutral-400 font-medium">
                          {log.accountUsername ? `@${log.accountUsername}` : '-'}
                        </td>
                        <td className="p-4">
                          {log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                              <ShieldAlert className="w-3 h-3" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right font-medium text-neutral-400">{time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
