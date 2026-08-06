'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Users, UserPlus, Trash2, Mail, Shield, Check, 
  HelpCircle, X, CheckCircle2, UserCheck, AlertCircle 
} from 'lucide-react';

const GET_TEAM = gql`
  query GetTeam {
    teamMembers {
      id
      name
      email
      role
      status
    }
  }
`;

const INVITE_MEMBER = gql`
  mutation Invite($email: String!, $role: String!) {
    inviteTeamMember(email: $email, role: $role) {
      id
      name
      email
      role
      status
    }
  }
`;

const REMOVE_MEMBER = gql`
  mutation Remove($id: ID!) {
    removeTeamMember(id: $id)
  }
`;

export default function TeamPage() {
  const { data, loading, refetch } = useQuery(GET_TEAM);
  const [inviteMember, { loading: inviteLoading }] = useMutation(INVITE_MEMBER);
  const [removeMember] = useMutation(REMOVE_MEMBER);

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please provide a valid email address.');
      return;
    }

    try {
      await inviteMember({
        variables: { email, role }
      });
      setModalOpen(false);
      setEmail('');
      setRole('editor');
      refetch();
      if (window.showToast) window.showToast(`Invitation sent to ${email}!`);
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message || 'Invitation failed.', 'error');
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove team member "${name}"?`)) return;
    try {
      await removeMember({ variables: { id } });
      refetch();
      if (window.showToast) window.showToast('Team member removed from workspace.');
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message || 'Failed to remove member.', 'error');
    }
  };

  const members = (data as any)?.teamMembers || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Team Management</h2>
            <p className="text-sm text-neutral-500">Invite colleagues and coordinate roles across your dashboard.</p>
          </div>
          
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-95 shadow-md shadow-red-600/10 active:scale-[0.98] self-end sm:self-auto transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>

        {/* Members Table */}
        {loading && members.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl h-64 animate-pulse"></div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Workspace Role</th>
                    <th className="p-4">Access Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {members.map((member: any) => (
                    <tr key={member.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-950/30 transition-colors">
                      <td className="p-4 pl-6 font-bold text-neutral-850 dark:text-neutral-200 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-500 uppercase">
                          {member.name.slice(0, 2)}
                        </div>
                        {member.name}
                      </td>
                      <td className="p-4 text-neutral-500">{member.email}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 capitalize font-semibold text-neutral-800 dark:text-neutral-200">
                          <Shield className="w-3.5 h-3.5 text-neutral-400" />
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {member.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Active Member
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Mail className="w-3 h-3" />
                            Invited
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => handleRemove(member.id, member.name)}
                          className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all"
                          title="Remove member access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invite Dialog Modal */}
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
                <h3 className="text-xl font-bold">Invite Workspace Member</h3>
                <p className="text-xs text-neutral-400">Add team members to access scheduled feeds and logs.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 pl-10 pr-4 py-3 rounded-xl text-white placeholder-neutral-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Workspace Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 px-4 py-3 rounded-xl text-white focus:outline-none transition-all"
                  >
                    <option value="admin">Admin (Full write, view & user control)</option>
                    <option value="editor">Editor (Write & publish pins)</option>
                    <option value="viewer">Viewer (Read-only access)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:opacity-95 transition-all"
                >
                  {inviteLoading ? 'Sending Invite...' : 'Send Workspace Invitation'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
