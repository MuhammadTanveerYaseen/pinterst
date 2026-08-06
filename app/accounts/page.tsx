'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Pin, Plus, Trash2, RefreshCw, CheckCircle2, AlertTriangle, 
  Users, Folder, Eye, ShieldAlert, Sparkles, X, ChevronRight 
} from 'lucide-react';

const GET_ACCOUNTS = gql`
  query GetAccounts {
    pinterestAccounts {
      id
      username
      profileImage
      followers
      following
      boardsCount
      monthlyViews
      status
      syncStatus
      lastSyncTime
      defaultDestinationUrl
    }
  }
`;

const CONNECT_ACCOUNT = gql`
  mutation ConnectAccount($code: String, $usernameOverride: String, $email: String, $password: String) {
    connectPinterestAccount(code: $code, usernameOverride: $usernameOverride, email: $email, password: $password) {
      id
      username
      profileImage
    }
  }
`;

const DISCONNECT_ACCOUNT = gql`
  mutation DisconnectAccount($accountId: ID!) {
    disconnectPinterestAccount(accountId: $accountId)
  }
`;

const UPDATE_DEFAULT_LINK = gql`
  mutation UpdateAccountDefaultLink($accountId: ID!, $defaultDestinationUrl: String!) {
    updateAccountDefaultLink(accountId: $accountId, defaultDestinationUrl: $defaultDestinationUrl) {
      id
      defaultDestinationUrl
    }
  }
`;

export default function AccountsPage() {
  const { data, loading, error, refetch } = useQuery(GET_ACCOUNTS);
  const [connectAccount, { loading: connectLoading }] = useMutation(CONNECT_ACCOUNT);
  const [disconnectAccount] = useMutation(DISCONNECT_ACCOUNT);
  const [updateDefaultLink] = useMutation(UPDATE_DEFAULT_LINK);

  const [modalOpen, setModalOpen] = useState(false);
  const [mockUsername, setMockUsername] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [simulatedStep, setSimulatedStep] = useState(0); // 0: Input, 1: Connecting, 2: Synced

  const handleSaveDefaultLink = async (accountId: string, link: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pinterest_default_link', link);
      }
      await updateDefaultLink({ variables: { accountId, defaultDestinationUrl: link } });
      refetch();
      if (window.showToast) window.showToast('Default destination link saved permanently!');
    } catch (e: any) {
      if (window.showToast) window.showToast(e.message || 'Failed to update link.', 'error');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulatedStep(1);
    
    try {
      const result = await connectAccount({
        variables: {
          usernameOverride: mockUsername || undefined,
          email: accountEmail || undefined,
          password: accountPassword || undefined
        }
      });
      
      const username = (result?.data as any)?.connectPinterestAccount?.username || 'your account';
      setSimulatedStep(2);
      setTimeout(() => {
        setModalOpen(false);
        setSimulatedStep(0);
        setMockUsername('');
        setAccountEmail('');
        setAccountPassword('');
        refetch();
        if (window.showToast) window.showToast(`Connected @${username} via Selenium Automation successfully!`);
      }, 1200);
    } catch (err: any) {
      setSimulatedStep(0);
      if (window.showToast) window.showToast(err.message || 'Selenium Account Link failed.', 'error');
    }
  };

  const handleDisconnect = async (accountId: string, username: string) => {
    if (!confirm(`Are you sure you want to disconnect @${username}?`)) return;

    try {
      await disconnectAccount({ variables: { accountId } });
      refetch();
      if (window.showToast) window.showToast(`Disconnected @${username} from dashboard.`);
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message || 'Failed to disconnect account.', 'error');
    }
  };

  const handleManualSync = async () => {
    if (window.showToast) window.showToast('Refreshing Pinterest profiles...', 'info');
    await refetch();
    if (window.showToast) window.showToast('Profiles and boards refreshed.');
  };

  const accounts = (data as any)?.pinterestAccounts || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Pinterest Accounts</h2>
            <p className="text-sm text-neutral-500">Connect, remove, and sync your linked profiles.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSync}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 transition-all duration-150"
              title="Sync Accounts"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-95 shadow-md shadow-red-600/10 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Link Profile
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Query Warning: {error.message}</span>
            </div>
            <button onClick={() => refetch()} className="underline font-bold hover:text-amber-700">Retry</button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && accounts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mb-2">
              <Pin className="w-9 h-9 rotate-45" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">No Connected Profiles</h3>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                No Pinterest accounts are linked to this workspace. Link accounts via simulated sandbox mode to unlock pin scheduling.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-6 rounded-2xl hover:opacity-95 shadow-md shadow-red-600/10 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              Link Pinterest Profile
            </button>
          </div>
        ) : (
          /* Grid list */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account: any) => {
              const syncTime = account.lastSyncTime
                ? new Date(account.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Never';
              
              return (
                <div 
                  key={account.id} 
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col relative group hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md transition-all duration-200"
                >
                  {/* Account Status Badge */}
                  <div className="absolute top-6 right-6">
                    {account.status === 'connected' ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        Expired
                      </span>
                    )}
                  </div>

                  {/* Header metadata */}
                  <div className="flex items-center gap-4">
                    <img 
                      src={account.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} 
                      alt={account.username} 
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-neutral-100 dark:ring-neutral-800"
                    />
                    <div>
                      <h4 className="font-extrabold text-lg">@{account.username}</h4>
                      <p className="text-xs text-neutral-400">Synced: {syncTime}</p>
                    </div>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-3 gap-2 mt-6 p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl text-center">
                    <div className="space-y-1">
                      <span className="text-xxs text-neutral-400 font-semibold block uppercase">Followers</span>
                      <span className="text-sm font-black flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        {account.followers}
                      </span>
                    </div>
                    <div className="space-y-1 border-x border-neutral-200 dark:border-neutral-800">
                      <span className="text-xxs text-neutral-400 font-semibold block uppercase">Boards</span>
                      <span className="text-sm font-black flex items-center justify-center gap-1">
                        <Folder className="w-3.5 h-3.5 text-emerald-500" />
                        {account.boardsCount}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xxs text-neutral-400 font-semibold block uppercase">Monthly Views</span>
                      <span className="text-sm font-black flex items-center justify-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-red-500" />
                        {account.monthlyViews > 1000 ? `${(account.monthlyViews / 1000).toFixed(0)}k` : account.monthlyViews}
                      </span>
                    </div>
                  </div>

                  {/* Default Destination Link */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                    <label className="text-xxs font-bold text-neutral-400 uppercase tracking-wider block">Default Destination Link</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        defaultValue={account.defaultDestinationUrl || ''}
                        placeholder="https://mywebsite.com"
                        id={`default-link-${account.id}`}
                        className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <button
                        onClick={() => {
                          const inputEl = document.getElementById(`default-link-${account.id}`) as HTMLInputElement;
                          if (inputEl) handleSaveDefaultLink(account.id, inputEl.value);
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-all"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                    <button
                      onClick={() => handleDisconnect(account.id, account.username)}
                      className="flex-1 inline-flex items-center justify-center gap-2 border border-red-500/20 text-red-500 dark:text-red-400 py-2 rounded-xl text-xs font-semibold hover:bg-red-500/5 active:scale-[0.98] transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Disconnect Account
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Connect Account Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative text-white space-y-6 animate-slide-in">
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {simulatedStep === 0 && (
                <form onSubmit={handleConnect} className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center mx-auto rotate-45 mb-2 shadow-lg">
                      <Pin className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Link Pinterest Account (Selenium)</h3>
                    <p className="text-xs text-neutral-400 px-4">
                      Connect your Pinterest account for automated multi-account publication powered by Selenium WebDriver browser engine.
                    </p>
                  </div>

                  <div className="space-y-3 text-left">
                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">Pinterest Username / Handle</label>
                      <input
                        type="text"
                        value={mockUsername}
                        onChange={(e) => setMockUsername(e.target.value)}
                        placeholder="e.g. my_pinterest_brand"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">Pinterest Login Email</label>
                      <input
                        type="email"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">Pinterest Password</label>
                      <input
                        type="password"
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-300">Selenium Automation Engine</p>
                      <p className="text-emerald-500/80 mt-0.5 text-xxs">No official Pinterest API keys required. Browser sessions and publication are automated directly.</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={connectLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:opacity-95 transition-all disabled:opacity-60"
                  >
                    {connectLoading ? 'Linking with Selenium...' : 'Link Account with Selenium'}
                  </button>
                </form>
              )}

              {simulatedStep === 1 && (
                <div className="py-8 text-center space-y-4">
                  <svg className="animate-spin h-10 w-10 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Initializing Selenium Driver Session</h4>
                    <p className="text-xs text-neutral-400">Authenticating account and syncing saved boards via browser engine...</p>
                  </div>
                </div>
              )}

              {simulatedStep === 2 && (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Account Linked via Selenium</h4>
                    <p className="text-xs text-neutral-400">Syncing Pinterest boards and browser credentials...</p>
                  </div>
                </div>
              )}

              {/* Automation info */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xxs text-neutral-400 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-neutral-300">
                  <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  Selenium WebDriver Automation
                </p>
                <p>Bypasses official API limitations. All multi-account publishing tasks are automated directly through headless Chrome / Edge browser sessions.</p>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
