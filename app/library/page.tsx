'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import DashboardLayout from '../../components/DashboardLayout';
import ImageUploader from '../../components/ImageUploader';
import { 
  FolderHeart, Search, Plus, Trash2, Edit3, Send, Link2, 
  Sparkles, Tag, X, Image as ImageIcon, Copy, Check 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const GET_LIBRARY = gql`
  query GetLibrary($search: String) {
    contentLibrary(search: $search) {
      id
      title
      description
      mediaUrl
      link
      tags
    }
  }
`;

const SAVE_ITEM = gql`
  mutation SaveItem($input: ContentItemInput!) {
    saveContentItem(input: $input) {
      id
      title
      description
      mediaUrl
      link
      tags
    }
  }
`;

const DELETE_ITEM = gql`
  mutation DeleteItem($id: ID!) {
    deleteContentItem(id: $id)
  }
`;

export default function ContentLibraryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, loading, refetch } = useQuery(GET_LIBRARY, {
    variables: { search: searchTerm }
  });

  const [saveItem, { loading: saveLoading }] = useMutation(SAVE_ITEM);
  const [deleteItem] = useMutation(DELETE_ITEM);

  // Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [link, setLink] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setLink('');
    setTagsInput('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setMediaUrl(item.mediaUrl);
    setLink(item.link);
    setTagsInput(item.tags.join(', '));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !mediaUrl) {
      alert('Title and Image URL are required.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      await saveItem({
        variables: {
          input: {
            id: editingId,
            title,
            description,
            mediaUrl,
            link,
            tags
          }
        }
      });
      setModalOpen(false);
      refetch();
      if (window.showToast) window.showToast(editingId ? 'Library item updated.' : 'Asset added to content library!');
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message || 'Failed to save item.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteItem({ variables: { id } });
      refetch();
      if (window.showToast) window.showToast('Item removed from library.');
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message || 'Failed to delete item.', 'error');
    }
  };

  const handleCopyCode = (item: any) => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (window.showToast) window.showToast('Asset JSON metadata copied!');
  };

  const handleUseInComposer = (item: any) => {
    // Redirect to scheduler with query params
    const params = new URLSearchParams({
      title: item.title,
      description: item.description,
      mediaUrl: item.mediaUrl,
      link: item.link
    });
    router.push(`/scheduler?${params.toString()}`);
  };

  const handleRandomStock = () => {
    const images = [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=400'
    ];
    setMediaUrl(images[Math.floor(Math.random() * images.length)]!);
  };

  const items = (data as any)?.contentLibrary || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Content Library</h2>
            <p className="text-sm text-neutral-500">Store templates, reuse creative media, and search evergreen assets.</p>
          </div>
          
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-95 shadow-md shadow-red-600/10 active:scale-[0.98] self-end sm:self-auto transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, details, tags..."
            className="w-full bg-transparent pl-11 pr-4 py-3 rounded-2xl text-sm focus:outline-none"
          />
        </div>

        {/* Loading Indicator */}
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm animate-slide-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mb-2">
              <FolderHeart className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Your Library is Empty</h3>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                Save reusable graphics, titles, and SEO summaries. Speed up post scheduling by importing assets with one click.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-6 rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              Create First Asset
            </button>
          </div>
        ) : (
          /* Grid list */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item: any) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Media card header */}
                <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center text-neutral-400 overflow-hidden">
                  <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  
                  {/* Floating tags */}
                  {item.link && (
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm text-neutral-900 dark:text-white px-2 py-1 rounded-lg text-xxs font-bold flex items-center gap-1 shadow-sm max-w-[80%] truncate">
                      <Link2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{item.link.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}

                  {/* Context controls overlay */}
                  <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleUseInComposer(item)}
                      className="p-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      Publish Pin
                    </button>
                    <button
                      onClick={() => handleCopyCode(item)}
                      className="p-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 shadow-md active:scale-95 transition-all"
                      title="Copy metadata"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Details body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-sm leading-tight text-neutral-800 dark:text-neutral-200 line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-400 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xxs font-semibold">
                            <Tag className="w-2 h-2" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Edit/Delete */}
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal dialog */}
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
                <h3 className="text-xl font-bold">{editingId ? 'Edit Library Asset' : 'Add Reusable Asset'}</h3>
                <p className="text-xs text-neutral-400">Save images and text snippets for fast scheduling reuse.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Asset Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Catchy pin title template"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 px-4 py-3 rounded-xl text-white placeholder-neutral-600 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Asset Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Pre-optimized Pinterest description..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 px-4 py-3 rounded-xl text-white placeholder-neutral-600 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Destination Link</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://myblog.com/link"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 px-4 py-3 rounded-xl text-white placeholder-neutral-600 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Asset Image</label>
                  <ImageUploader
                    value={mediaUrl}
                    onChange={setMediaUrl}
                    placeholder="https://picsum.photos/..."
                  />
                </div>


                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-neutral-400 uppercase tracking-wider block">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="decor, diy, summer, bedroom"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 px-4 py-3 rounded-xl text-white placeholder-neutral-600 focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:opacity-95 transition-all"
                >
                  {saveLoading ? 'Saving...' : editingId ? 'Update Asset' : 'Save Asset'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
