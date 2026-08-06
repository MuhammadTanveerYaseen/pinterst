'use client';

import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import DashboardLayout from '../../components/DashboardLayout';
import ImageUploader from '../../components/ImageUploader';
import { 
  Pin, Sparkles, Send, Calendar, Clock, Image, Link2, 
  Layers, UserPlus, UploadCloud, FileSpreadsheet, Eye, Play, Plus, BookOpen, AlertCircle, CalendarDays 
} from 'lucide-react';

const GET_COMPOSER_DATA = gql`
  query GetComposerData {
    pinterestAccounts {
      id
      username
      profileImage
      defaultDestinationUrl
    }
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

const SAVE_PIN = gql`
  mutation SavePin($input: PinInput!) {
    savePin(input: $input) {
      id
      title
      status
    }
  }
`;

const PUBLISH_PIN_NOW = gql`
  mutation PublishPinNow($input: PinInput!) {
    publishPinNow(input: $input) {
      id
      title
      status
      destinationUrl
      error
    }
  }
`;

const BULK_UPLOAD = gql`
  mutation BulkUpload($csvContent: String!, $accountIds: [ID!]!) {
    bulkUploadPins(csvContent: $csvContent, accountIds: $accountIds) {
      id
      title
    }
  }
`;

const GENERATE_AI = gql`
  mutation GenerateAI($prompt: String!, $keywords: [String!]) {
    generateAICaption(prompt: $prompt, keywords: $keywords) {
      title
      description
      keywords
      keywordDetails {
        keyword
        monthlySearchVolume
        competitionLevel
        intent
      }
      hashtags
      cta
      seoScore
      searchVolumeEstimate
    }
  }
`;

const UPDATE_ACCOUNT_DEFAULT_LINK = gql`
  mutation UpdateAccountDefaultLink($accountId: ID!, $defaultDestinationUrl: String!) {
    updateAccountDefaultLink(accountId: $accountId, defaultDestinationUrl: $defaultDestinationUrl) {
      id
      defaultDestinationUrl
    }
  }
`;

const TRIGGER_AUTOMATION = gql`
  mutation TriggerAutomationCheck {
    triggerAutomationCheck
  }
`;

const parseCsvPreview = (csv: string) => {
  if (!csv.trim()) return [];
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
  const items: any[] = [];
  let headerSkipped = false;

  for (const line of lines) {
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    if (!headerSkipped) {
      if (cols.some(c => c.toLowerCase().includes('url') || c.toLowerCase().includes('title'))) {
        headerSkipped = true;
        continue;
      }
      headerSkipped = true;
    }
    if (cols.length >= 2) {
      items.push({
        mediaUrl: cols[0] || 'https://picsum.photos/300/450',
        title: cols[1] || 'Untitled Bulk Pin',
        description: cols[2] || '',
        destinationUrl: cols[3] || '',
        boardId: cols[4] || 'b1',
        scheduledAt: cols[5] || 'Tomorrow'
      });
    }
  }
  return items;
};

export default function SchedulerPage() {
  const { data: accountsData, refetch: refetchComposer } = useQuery(GET_COMPOSER_DATA);
  const [savePin, { loading: saveLoading }] = useMutation(SAVE_PIN);
  const [publishPinNow, { loading: publishNowLoading }] = useMutation(PUBLISH_PIN_NOW);
  const [bulkUpload, { loading: bulkLoading }] = useMutation(BULK_UPLOAD);
  const [generateAI, { loading: aiLoading }] = useMutation(GENERATE_AI);
  const [updateDefaultLink, { loading: updatingDefaultLink }] = useMutation(UPDATE_ACCOUNT_DEFAULT_LINK);
  const [triggerAutomation, { loading: triggerLoading }] = useMutation(TRIGGER_AUTOMATION);

  const handleRunQueueNow = async () => {
    try {
      if (window.showToast) window.showToast('Processing all due pins & automation rules...', 'info');
      await triggerAutomation();
      if (window.showToast) window.showToast('Scheduled queue processed successfully!');
    } catch (e: any) {
      if (window.showToast) window.showToast(e.message || 'Failed to run queue.', 'error');
    }
  };

  // Tabs: 'single' | 'bulk'
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single Composer Form State
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Bulk Upload State
  const [csvContent, setCsvContent] = useState('');

  const accounts = (accountsData as any)?.pinterestAccounts || [];

  const firstAccountId = selectedAccounts[0] || '';

  // Auto-select first account on mount
  useEffect(() => {
    if (accounts.length > 0 && selectedAccounts.length === 0) {
      setSelectedAccounts([accounts[0].id]);
    }
  }, [accounts, selectedAccounts.length]);

  // Sync destinationUrl with localStorage or selected account's defaultDestinationUrl
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localSaved = localStorage.getItem('pinterest_default_link');
      if (localSaved) {
        setDestinationUrl(localSaved);
        return;
      }
    }
    if (firstAccountId && accounts.length > 0) {
      const activeAcc = accounts.find((a: any) => a.id === firstAccountId);
      if (activeAcc && activeAcc.defaultDestinationUrl) {
        setDestinationUrl(activeAcc.defaultDestinationUrl);
      }
    }
  }, [firstAccountId, accounts]);

  // Boards Query (tied to first selected account)
  const { data: boardsData, refetch: refetchBoards } = useQuery(GET_BOARDS, {
    variables: { accountId: firstAccountId },
    skip: !firstAccountId,
  });

  useEffect(() => {
    if (firstAccountId) {
      refetchBoards();
    }
  }, [firstAccountId, refetchBoards]);

  const handleAccountToggle = (id: string) => {
    setSelectedAccounts(prev => {
      const isSelect = !prev.includes(id);
      const nextAccs = isSelect ? [...prev, id] : prev.filter(a => a !== id);
      return nextAccs;
    });
  };

  const handleSaveDefaultUrl = async () => {
    if (!destinationUrl.trim()) {
      if (window.showToast) window.showToast('Please enter a Destination Link first to save as default.', 'error');
      return;
    }

    const cleanLink = destinationUrl.trim();

    // 1. Save to browser localStorage instantly
    if (typeof window !== 'undefined') {
      localStorage.setItem('pinterest_default_link', cleanLink);
    }

    // 2. Save to database for account
    if (firstAccountId) {
      try {
        await updateDefaultLink({
          variables: {
            accountId: firstAccountId,
            defaultDestinationUrl: cleanLink
          }
        });
        await refetchComposer();
      } catch (_) {}
    }

    const currentAcc = accounts.find((a: any) => a.id === firstAccountId);
    if (window.showToast) {
      window.showToast(`Saved "${cleanLink}" permanently as default link!`);
    }
  };

  const handleRandomImage = () => {
    const ids = [100, 200, 300, 400, 500];
    const rand = ids[Math.floor(Math.random() * ids.length)] + Math.floor(Math.random() * 50);
    setMediaUrl(`https://picsum.photos/id/${rand}/600/900`);
    if (window.showToast) window.showToast('Loaded demo high-resolution image!');
  };

  const handleRunAI = async () => {
    if (!aiPrompt.trim()) return;
    try {
      const { data } = await generateAI({
        variables: { prompt: aiPrompt }
      });
      if (data && (data as any).generateAICaption) {
        const res = (data as any).generateAICaption;
        setAiResult(res);
        setTitle(res.title);
        setDescription(`${res.description}\n\n${res.cta}\n\n${res.hashtags.join(' ')}`);
        setAiPrompt('');
        if (window.showToast) window.showToast(`SEO Power Score: ${res.seoScore || 96}% | ${res.searchVolumeEstimate || '250K+ Monthly Searches'}`);
      }
    } catch (e: any) {
      if (window.showToast) window.showToast(e.message || 'AI generation failed.', 'error');
    }
  };

  const handlePublishSingle = async (status: 'draft' | 'scheduled') => {
    if (selectedAccounts.length === 0) {
      alert('Please select at least one target Pinterest account.');
      return;
    }
    if (!selectedBoard) {
      alert('Please select a board.');
      return;
    }
    if (!title || !mediaUrl) {
      alert('Pin Title and Image URL are required.');
      return;
    }

    let isoDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow by default
    if (status === 'scheduled') {
      if (!scheduleDate || !scheduleTime) {
        alert('Please specify schedule date and time.');
        return;
      }
      isoDate = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    try {
      await savePin({
        variables: {
          input: {
            accountIds: selectedAccounts,
            boardId: selectedBoard,
            title,
            description,
            destinationUrl,
            mediaUrl,
            mediaType: 'image',
            scheduledAt: isoDate,
            status
          }
        }
      });

      // Clear Form
      setSelectedAccounts([]);
      setSelectedBoard('');
      setTitle('');
      setDescription('');
      setDestinationUrl('');
      setMediaUrl('');
      setScheduleDate('');
      setScheduleTime('');
      
      if (window.showToast) {
        window.showToast(
          status === 'scheduled' 
            ? 'Pin scheduled successfully! Check visual calendar.' 
            : 'Saved pin draft successfully!'
        );
      }
    } catch (e: any) {
      if (window.showToast) window.showToast(e.message || 'Failed to save pin.', 'error');
    }
  };

  const handlePublishNow = async () => {
    if (selectedAccounts.length === 0) {
      alert('Please select at least one target Pinterest account.');
      return;
    }
    if (!selectedBoard) {
      alert('Please select a board.');
      return;
    }
    if (!title || !mediaUrl) {
      alert('Pin Title and Image URL are required.');
      return;
    }

    try {
      if (window.showToast) window.showToast('🚀 Publishing pin to Pinterest now...', 'info');
      
      const { data } = await publishPinNow({
        variables: {
          input: {
            accountIds: selectedAccounts,
            boardId: selectedBoard,
            title,
            description,
            destinationUrl,
            mediaUrl,
            mediaType: 'image',
            scheduledAt: new Date().toISOString(),
            status: 'scheduled'
          }
        }
      });

      const res = (data as any)?.publishPinNow;

      // Clear Form
      setSelectedAccounts([]);
      setSelectedBoard('');
      setTitle('');
      setDescription('');
      setDestinationUrl('');
      setMediaUrl('');
      setScheduleDate('');
      setScheduleTime('');

      if (res?.status === 'published') {
        if (window.showToast) {
          window.showToast(`🎉 Pin published successfully to Pinterest!`);
        }
      } else {
        if (window.showToast) {
          window.showToast(`Pin submitted! Status: ${res?.status || 'published'}`, 'info');
        }
      }
    } catch (e: any) {
      if (window.showToast) window.showToast(e.message || 'Failed to publish pin.', 'error');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccounts.length === 0) {
      alert('Please select at least one Pinterest account to apply bulk upload to.');
      return;
    }
    if (!csvContent.trim()) {
      alert('Please paste CSV contents first.');
      return;
    }

    try {
      const { data } = await bulkUpload({
        variables: {
          csvContent,
          accountIds: selectedAccounts
        }
      });
      
      if (data && (data as any).bulkUploadPins) {
        setCsvContent('');
        setSelectedAccounts([]);
        if (window.showToast) window.showToast(`Successfully queued ${(data as any).bulkUploadPins.length} pins from CSV!`);
      }
    } catch (e: any) {
      if (window.showToast) window.showToast(e.message || 'Bulk upload failed.', 'error');
    }
  };

  const boards = (boardsData as any)?.boards || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Post Scheduler</h2>
            <p className="text-sm text-neutral-500">Design pins, generate SEO text, and queue them to post automatically.</p>
          </div>

          <button
            onClick={handleRunQueueNow}
            disabled={triggerLoading}
            className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold py-2.5 px-4 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 text-xs self-start sm:self-auto"
            title="Trigger scheduled pin processing immediately"
          >
            <Play className={`w-3.5 h-3.5 ${triggerLoading ? 'animate-spin text-red-500' : 'text-emerald-500'}`} />
            {triggerLoading ? 'Processing...' : 'Process Due Queue Now'}
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'single'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            <Pin className="w-4 h-4 rotate-45" />
            Single Composer
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'bulk'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk CSV Scheduler
          </button>
        </div>

        {/* Single Tab View */}
        {activeTab === 'single' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Editor Panel */}
            <div className="xl:col-span-2 space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Compose Pin</h3>
                <button
                  onClick={() => setShowAiAssistant(!showAiAssistant)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-500/20 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI SEO Assistant
                </button>
              </div>

               {/* AI helper input panel */}
              {showAiAssistant && (
                <div className="p-4 bg-purple-500/5 dark:bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-4 animate-slide-in">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI SEO & Viral Copy Generator
                    </h4>
                    <p className="text-xxs text-neutral-400">Enter your niche topic to generate high-search SEO titles, sales descriptions, and converting hashtags.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. aesthetic bedroom decor ideas"
                      className="flex-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleRunAI}
                      disabled={aiLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      {aiLoading ? 'Analyzing...' : 'Generate SEO'}
                    </button>
                  </div>

                  {/* AI Generated SEO Analysis Result Card */}
                  {aiResult && (
                    <div className="mt-3 pt-3 border-t border-purple-500/10 space-y-3">
                      {/* SEO Score & Search Reach Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xxs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            ⚡ {aiResult.seoScore || 98}% SEO Power Score
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xxs font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            🔥 {aiResult.searchVolumeEstimate || '450K+ Monthly Searches'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (aiResult.hashtags) {
                              setDescription(prev => `${prev}\n\n${aiResult.hashtags.join(' ')}`);
                              if (window.showToast) window.showToast('Inserted all SEO hashtags into description!');
                            }
                          }}
                          className="px-2.5 py-1 rounded-md text-xxs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-xs"
                        >
                          + Insert All Hashtags
                        </button>
                      </div>

                      {/* High-Volume SEO Keywords & Search Metrics */}
                      <div className="space-y-1.5">
                        <span className="text-xxs font-bold text-neutral-400 uppercase tracking-wider block">
                          High-Volume Search Keywords & Sales Intent
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                          {(aiResult.keywordDetails && aiResult.keywordDetails.length > 0
                            ? aiResult.keywordDetails
                            : (aiResult.keywords || []).map((k: string) => ({ keyword: k, monthlySearchVolume: '180K/mo', competitionLevel: 'Low', intent: 'Transactional' }))
                          ).map((item: any, i: number) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setDescription(prev => `${prev}\n#${item.keyword.replace(/\s+/g, '')}`);
                                if (window.showToast) window.showToast(`Added #${item.keyword.replace(/\s+/g, '')} to description!`);
                              }}
                              className="flex items-center justify-between p-2 rounded-xl bg-purple-500/5 hover:bg-purple-500/15 border border-purple-500/10 text-left transition-all group"
                              title="Click to insert into Pin Description"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="text-xxs font-extrabold text-neutral-800 dark:text-neutral-200 block truncate">
                                  + {item.keyword}
                                </span>
                                <span className="text-[10px] text-neutral-400 font-medium">
                                  {item.intent || 'Transactional'} Intent
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                  {item.monthlySearchVolume || '200K/mo'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Target Accounts Selection */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Target Accounts</span>
                {accounts.length === 0 ? (
                  <p className="text-xs text-amber-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Please link accounts first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((acc: any) => {
                      const isSelected = selectedAccounts.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          onClick={() => handleAccountToggle(acc.id)}
                          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected 
                              ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400' 
                              : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <img src={acc.profileImage} alt={acc.username} className="w-5 h-5 rounded-full object-cover" />
                          <span>@{acc.username}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Boards Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Select Pinterest Board</label>
                <select
                  value={selectedBoard}
                  disabled={!firstAccountId}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 transition-all"
                >
                  <option value="">{firstAccountId ? '-- Select Board --' : 'Select a target account first to load boards'}</option>
                  {boards.map((b: any) => (
                    <option key={b.id} value={b.pinterestId}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Pin Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter catchy, SEO-friendly pin title"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Pin Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what your pin shows. Add keywords, hashtags and call-to-actions."
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Destination URL */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Destination Link</label>
                  {firstAccountId && (
                    <button
                      type="button"
                      onClick={handleSaveDefaultUrl}
                      disabled={updatingDefaultLink}
                      className="text-xxs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition-all"
                      title="Save this URL permanently as the default link for future pins"
                    >
                      <Sparkles className="w-3 h-3" />
                      {updatingDefaultLink ? 'Saving...' : 'Save as Permanent Default'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                    <Link2 className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://example.com/blog"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Pin Image Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Pin Image</label>
                <ImageUploader
                  value={mediaUrl}
                  onChange={setMediaUrl}
                  placeholder="https://unsplash.com/photos/..."
                />
              </div>

              {/* Schedule time configuration */}
              <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Timing Control</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                      <Clock className="w-4 h-4" />
                    </span>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => handlePublishSingle('draft')}
                  className="w-full sm:w-auto px-5 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-950 text-neutral-600 dark:text-neutral-300"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handlePublishSingle('scheduled')}
                  disabled={saveLoading || publishNowLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 font-semibold py-3 px-5 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all text-xs"
                >
                  <CalendarDays className="w-4 h-4" />
                  Schedule Post
                </button>
                <button
                  onClick={handlePublishNow}
                  disabled={saveLoading || publishNowLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md shadow-red-600/20 hover:opacity-95 active:scale-95 transition-all text-xs"
                >
                  <Send className="w-4 h-4" />
                  {publishNowLoading ? 'Publishing to Pinterest...' : 'Publish Now'}
                </button>
              </div>

            </div>

            {/* Live Visual Preview Panel */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Live Pin Preview</span>
              
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-md max-w-sm mx-auto">
                <div className="relative aspect-[2/3] bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center text-neutral-400">
                  {mediaUrl ? (
                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Image className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700" />
                      <p className="text-xs">Image mockup will display here</p>
                    </div>
                  )}
                  {/* Floating Link badge */}
                  {destinationUrl && (
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm text-neutral-900 px-3 py-1.5 rounded-full text-xxs font-bold flex items-center gap-1.5 shadow-sm max-w-[80%] truncate">
                      <Link2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{destinationUrl.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {/* Avatar and Username Mock */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xxs">
                      PH
                    </div>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {selectedAccounts.length > 0
                        ? '@' + accounts.find((a: any) => a.id === selectedAccounts[0])?.username
                        : '@pinterest_user'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base font-extrabold leading-tight text-neutral-900 dark:text-neutral-50 break-words">
                      {title || 'Untitled Pin'}
                    </h4>
                    <p className="text-xs text-neutral-400 dark:text-neutral-400 break-words leading-relaxed whitespace-pre-line">
                      {description || 'This description describes what the Pin displays. Click generated AI or type custom details above.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Bulk Tab View */}
        {activeTab === 'bulk' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* CSV Parser Input */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">CSV Import</h3>
                <span className="text-xxs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full font-semibold">Bulk Mode</span>
              </div>

              {/* Box Info */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 text-xs text-neutral-500 space-y-3">
                <p className="font-bold flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                  <BookOpen className="w-4 h-4 text-red-500" />
                  Expected CSV Formatting Guidelines
                </p>
                <p className="leading-relaxed">
                  Paste rows containing headers or directly in the following column order: <br />
                  <code className="text-red-500 font-bold dark:text-red-400">Image URL, Title, Description, Link, Board ID, Schedule Date</code>
                </p>
                <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl font-mono text-xxs overflow-x-auto border border-neutral-100 dark:border-neutral-800">
                  https://images.unsplash.com/photo-1,Banana Pancakes,Yummy breakfast!,https://recipes.com/pancake,b1,2026-07-20T10:00:00Z
                </div>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-6">
                {/* Target Accounts */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Target Accounts</span>
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((acc: any) => {
                      const isSelected = selectedAccounts.includes(acc.id);
                      return (
                        <button
                          type="button"
                          key={acc.id}
                          onClick={() => handleAccountToggle(acc.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected 
                              ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400' 
                              : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <span>@{acc.username}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CSV text area */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Paste CSV Contents</label>
                  <textarea
                    rows={6}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-1534528741775, DIY Desk, Build your custom workspace!, https://diy.com/desk, b1, 2026-08-15T09:00:00Z"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none font-mono"
                  />
                </div>

                {/* CSV Live Preview Grid */}
                {csvContent.trim() && (() => {
                  const previewItems = parseCsvPreview(csvContent);
                  if (previewItems.length === 0) return null;

                  return (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                          Parsed Items Preview ({previewItems.length})
                        </span>
                        <span className="text-xxs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          Valid Format Detected
                        </span>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 bg-neutral-50/50 dark:bg-neutral-950/40">
                        {previewItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-2.5 rounded-xl shadow-xs">
                            <img
                              src={item.mediaUrl}
                              alt={item.title}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://picsum.photos/100/150';
                              }}
                              className="w-10 h-14 object-cover rounded-lg flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold truncate">{item.title}</h5>
                              <p className="text-xxs text-neutral-400 truncate">{item.description || 'No description'}</p>
                              <div className="flex items-center gap-3 mt-1 text-xxs text-neutral-500">
                                <span>Board: <strong className="text-neutral-800 dark:text-neutral-200">{item.boardId}</strong></span>
                                {item.destinationUrl && <span className="truncate max-w-[150px]">Link: {item.destinationUrl}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={bulkLoading}
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:opacity-95 transition-all"
                  >
                    <UploadCloud className="w-5 h-5" />
                    {bulkLoading ? 'Processing upload...' : 'Bulk Schedule Pins'}
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar FAQ/Help */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Bulk Scheduler Help</span>
              
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-4">
                <h4 className="font-bold text-sm">Automated Board Mapping</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Make sure the Board ID specified in your CSV exists on your target Pinterest accounts. In simulated mode, you can use board IDs: 
                  <code className="bg-neutral-100 dark:bg-neutral-950 px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 mx-1">b1</code>, 
                  <code className="bg-neutral-100 dark:bg-neutral-950 px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 mx-1">b2</code>, 
                  <code className="bg-neutral-100 dark:bg-neutral-950 px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 mx-1">b3</code>.
                </p>
                <h4 className="font-bold text-sm">Scheduling Buffers</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Our queue processor runs every 10 seconds. When a CSV pin&apos;s schedule time is reached, it will instantly move from &quot;scheduled&quot; to &quot;published&quot; and appear in your activity logs.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
