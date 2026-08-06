'use client';

import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Cpu, Plus, Trash2, Clock, Calendar, ToggleLeft, ToggleRight, 
  RefreshCw, CheckCircle, HelpCircle, X, AlertCircle, Play, Sparkles
} from 'lucide-react';

const GET_AUTOMATION_DATA = gql`
  query GetAutomationData {
    pinterestAccounts {
      id
      username
    }
    automationRules {
      id
      name
      accountIds
      boardId
      time
      days
      evergreen
      status
    }
  }
`;

const TRIGGER_AUTOMATION = gql`
  mutation TriggerAutomationCheck {
    triggerAutomationCheck
  }
`;

const SAVE_RULE = gql`
  mutation SaveRule($input: AutomationRuleInput!) {
    saveAutomationRule(input: $input) {
      id
      name
      status
    }
  }
`;

const DELETE_RULE = gql`
  mutation DeleteRule($id: ID!) {
    deleteAutomationRule(id: $id)
  }
`;

const GET_BOARDS = gql`
  query GetBoards($accountId: ID!) {
    boards(accountId: $accountId) {
      id
      pinterestId
      name
    }
  }
`;

export default function AutomationPage() {
  const { data, loading, refetch } = useQuery(GET_AUTOMATION_DATA);
  const [saveRule] = useMutation(SAVE_RULE);
  const [deleteRule] = useMutation(DELETE_RULE);
  const [triggerAutomation, { loading: triggerLoading }] = useMutation(TRIGGER_AUTOMATION);

  const handleRunNow = async () => {
    try {
      if (window.showToast) window.showToast('Running automation rules check...', 'info');
      await triggerAutomation();
      await refetch();
      if (window.showToast) window.showToast('Automation check executed successfully!');
    } catch (e: any) {
      if (window.showToast) window.showToast(e.message || 'Failed to run automation.', 'error');
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [ruleTime, setRuleTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [evergreen, setEvergreen] = useState(false);

  // For boards dropdown
  const firstAccountId = selectedAccounts[0] || '';
  const { data: boardsData, refetch: refetchBoards } = useQuery(GET_BOARDS, {
    variables: { accountId: firstAccountId },
    skip: !firstAccountId,
  });

  useEffect(() => {
    if (firstAccountId) {
      refetchBoards();
    }
  }, [firstAccountId, refetchBoards]);

  const handleOpenCreate = () => {
    setRuleName('');
    setSelectedAccounts([]);
    setSelectedBoard('');
    setRuleTime('09:00');
    setSelectedDays([]);
    setEvergreen(false);
    setModalOpen(true);
  };

  const handleAccountToggle = (id: string) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || selectedAccounts.length === 0 || !selectedBoard || selectedDays.length === 0) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      await saveRule({
        variables: {
          input: {
            name: ruleName,
            accountIds: selectedAccounts,
            boardId: selectedBoard,
            time: ruleTime,
            days: selectedDays,
            evergreen,
            status: 'active'
          }
        }
      });
      setModalOpen(false);
      refetch();
      if (window.showToast) window.showToast('Automation rule successfully registered!');
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message || 'Failed to save rule.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete automation rule "${name}"?`)) return;
    try {
      await deleteRule({ variables: { id } });
      refetch();
      if (window.showToast) window.showToast('Automation rule removed.');
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message || 'Failed to delete rule.', 'error');
    }
  };

  const handleToggleStatus = async (rule: any) => {
    const nextStatus = rule.status === 'active' ? 'inactive' : 'active';
    try {
      await saveRule({
        variables: {
          input: {
            id: rule.id,
            name: rule.name,
            accountIds: rule.accountIds,
            boardId: rule.boardId,
            time: rule.time,
            days: rule.days,
            evergreen: rule.evergreen,
            status: nextStatus
          }
        }
      });
      refetch();
      if (window.showToast) window.showToast(`Rule status updated to ${nextStatus}.`);
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message || 'Failed to toggle rule.', 'error');
    }
  };

  const accounts = (data as any)?.pinterestAccounts || [];
  const rules = (data as any)?.automationRules || [];
  const boards = (boardsData as any)?.boards || [];

  const daysList = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Automation Rules</h2>
            <p className="text-sm text-neutral-500">Configure recurring schedulers, evergreen recyclers, and post intervals.</p>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={handleRunNow}
              disabled={triggerLoading}
              className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold py-2.5 px-4 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 text-xs"
              title="Run automation check immediately"
            >
              <Play className={`w-3.5 h-3.5 ${triggerLoading ? 'animate-spin text-red-500' : 'text-emerald-500'}`} />
              {triggerLoading ? 'Running...' : 'Run Automation Now'}
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-95 shadow-md shadow-red-600/10 active:scale-[0.98] transition-all text-xs"
            >
              <Plus className="w-4 h-4" />
              Create Rule
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && rules.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : rules.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mb-2">
              <Cpu className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">No Active Automation Rules</h3>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                Set up recurring auto-posts for specific days, or republish evergreen items every 60 days to keep your Pinterest account active automatically.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-6 rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              Configure First Rule
            </button>
          </div>
        ) : (
          /* Cards Grid List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.map((rule: any) => {
              const appliedAccounts = accounts.filter((a: any) => rule.accountIds.includes(a.id));
              
              return (
                <div 
                  key={rule.id} 
                  className={`bg-white dark:bg-neutral-900 border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200 ${
                    rule.status === 'active' 
                      ? 'border-neutral-200 dark:border-neutral-800' 
                      : 'border-neutral-100 dark:border-neutral-800/40 opacity-70'
                  }`}
                >
                  {/* Top Status */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base flex items-center gap-2">
                        <Cpu className={`w-5 h-5 ${rule.status === 'active' ? 'text-red-500' : 'text-neutral-400'}`} />
                        {rule.name}
                      </h4>
                      <span className="text-xxs text-neutral-400 font-bold block">Board ID: {rule.boardId}</span>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(rule)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                      title="Toggle active status"
                    >
                      {rule.status === 'active' 
                        ? <ToggleRight className="w-9 h-9 text-emerald-500" /> 
                        : <ToggleLeft className="w-9 h-9" />
                      }
                    </button>
                  </div>

                  {/* Grid details details */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl text-xs">
                    <div className="space-y-1">
                      <span className="text-xxs text-neutral-400 font-bold uppercase tracking-wider block">Trigger Days</span>
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                        {rule.days.join(', ')}
                      </p>
                    </div>
                    <div className="space-y-1 border-l border-neutral-200 dark:border-neutral-800 pl-4">
                      <span className="text-xxs text-neutral-400 font-bold uppercase tracking-wider block">Daily Time</span>
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {rule.time}
                      </p>
                    </div>
                  </div>

                  {/* Accounts info & Delete button */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Profiles:</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {appliedAccounts.map((a: any) => (
                          <span 
                            key={a.id} 
                            className="inline-block text-xxs font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-white dark:border-neutral-900"
                            title={`@${a.username}`}
                          >
                            {a.username.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(rule.id, rule.name)}
                      className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal Dialog */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative text-white space-y-6 animate-slide-in">
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-xl font-bold">Configure Automation Rule</h3>
                <p className="text-xs text-neutral-400">Build automated triggers to cross-post evergreens.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rule Name */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Rule Name</label>
                  <input
                    type="text"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="e.g. Monday Design Board Auto-Scheduler"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 px-4 py-3 rounded-xl text-white placeholder-neutral-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Target Profiles */}
                <div className="space-y-2">
                  <span className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Pinterest Profiles</span>
                  {accounts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 font-medium">
                      ⚠️ No Pinterest accounts connected. Go to <strong>Accounts Manager</strong> first and link at least one account.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {accounts.map((acc: any) => {
                        const isSelected = selectedAccounts.includes(acc.id);
                        return (
                          <button
                            type="button"
                            key={acc.id}
                            onClick={() => handleAccountToggle(acc.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xxs font-semibold transition-all ${
                              isSelected 
                                ? 'bg-red-500/10 border-red-500 text-red-600' 
                                : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-400'
                            }`}
                          >
                            @{acc.username}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Board Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Target Board</label>
                  <select
                    value={selectedBoard}
                    disabled={!firstAccountId}
                    onChange={(e) => setSelectedBoard(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 px-4 py-3 rounded-xl text-white placeholder-neutral-600 focus:outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">{firstAccountId ? '-- Select Board --' : 'Select a target account first to load boards'}</option>
                    {boards.map((b: any) => (
                      <option key={b.id} value={b.pinterestId}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Day Selectors */}
                <div className="space-y-2">
                  <span className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Trigger Days</span>
                  <div className="flex flex-wrap gap-1.5">
                    {daysList.map(d => {
                      const isSelected = selectedDays.includes(d);
                      return (
                        <button
                          type="button"
                          key={d}
                          onClick={() => handleDayToggle(d)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold capitalize transition-all ${
                            isSelected 
                              ? 'bg-red-500/10 border-red-500 text-red-600' 
                              : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-400'
                          }`}
                        >
                          {d.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time & Evergreen Switch */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Trigger Time</label>
                    <input
                      type="time"
                      value={ruleTime}
                      onChange={(e) => setRuleTime(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 px-4 py-3 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Evergreen Recycle</span>
                    <button
                      type="button"
                      onClick={() => setEvergreen(!evergreen)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-xs font-semibold transition-all ${
                        evergreen 
                          ? 'bg-red-500/10 border-red-500 text-red-600' 
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      <span>{evergreen ? 'Recycle active' : 'Disabled'}</span>
                      <RefreshCw className={`w-3.5 h-3.5 ${evergreen ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:opacity-95 transition-all"
                >
                  Create Trigger Rule
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
