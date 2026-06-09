import React, { useState, useMemo } from 'react';
import { SchoolData, SortConfig } from './types';
import { useFirebaseData } from './hooks/useFirebaseData';
import { ToastProvider, useToast } from './components/Toast';
import { SettingsPanel } from './components/SettingsPanel';
import { ActionMenu } from './components/ActionMenu';
import { SchoolModal } from './components/SchoolModal';
import { formatDisplayDate } from './lib/utils';
import { writeBatch, getDbDocPath, db } from './lib/firebase';
import { 
  Search, Settings, Cloud, CloudOff, Loader2, Plus, 
  Trash2, ChevronsUpDown, Check, BookOpen
} from 'lucide-react';

function Dashboard() {
  const { data: allData, loading, error, user } = useFirebaseData();
  const { showToast } = useToast();
  
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);

  const [drafts, setDrafts] = useState<SchoolData[]>(() => {
    try {
      const saved = localStorage.getItem('aplikasi-rapor-drafts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem('aplikasi-rapor-drafts', JSON.stringify(drafts));
  }, [drafts]);

  // Sorting and Filtering
  const processedData = useMemo(() => {
    let result = [...drafts, ...allData];
    
    // Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(q)
        )
      );
    }
    
    // Sort
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let vA = (a[sortConfig.key!] || '') as string | number;
        let vB = (b[sortConfig.key!] || '') as string | number;
        if (typeof vA === 'string') vA = vA.toLowerCase();
        if (typeof vB === 'string') vB = vB.toLowerCase();
        if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (vA > vB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [allData, search, sortConfig]);

  // Handlers
  const handleSort = (key: keyof SchoolData) => {
    setSortConfig(current => {
      if (current.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        if (current.direction === 'desc') return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === processedData.length && processedData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedData.map(d => d.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (window.confirm(`Hapus ${count} data terpilih selamanya?`)) {
      try {
        const batch = writeBatch(db);
        let draftIds = new Set<string>();
        
        selectedIds.forEach(id => {
          if (id.startsWith('draft-')) {
            draftIds.add(id);
          } else {
            batch.delete(getDbDocPath(id));
          }
        });

        if (draftIds.size < count) {
           await batch.commit();
        }
        
        if (draftIds.size > 0) {
           setDrafts(prev => prev.filter(d => !draftIds.has(d.id)));
        }

        setSelectedIds(new Set());
        showToast(`${count} data berhasil dihapus.`, "success");
      } catch (err) {
        showToast("Gagal menghapus data tersorot.", "error");
      }
    }
  };

  const openAddMenu = () => {
    setEditingSchool(null);
    setIsModalOpen(true);
  };

  const openEditMenu = (school: SchoolData) => {
    setEditingSchool(school);
    setIsModalOpen(true);
  };

  const highlightText = (text: string | undefined | null) => {
    if (!text) return "-";
    if (!search.trim()) return text;
    const terms = search.trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return text;
    
    const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = String(text).split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? <mark key={i} className="bg-amber-500/40 text-amber-100 rounded px-0.5">{part}</mark> : part
        )}
      </>
    );
  };

  const TableHeader = ({ label, sortKey, width, align = "left" }: { label: string, sortKey?: keyof SchoolData, width?: string, align?: "left" | "center" }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <th 
        className={`px-3 py-2 bg-[#f8fafc] dark:bg-[#0f0f13] text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap sticky top-0 z-20 
          ${sortKey ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-[#16161b] transition-colors select-none' : ''}
          ${isSorted ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : ''}
          ${align === 'center' ? 'text-center' : 'text-left'}
          border-b border-slate-300 dark:border-white/10
        `}
        style={{ width, backgroundClip: 'padding-box' }}
        onClick={() => sortKey && handleSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''}`}>
          {label}
          {sortKey && (
             <ChevronsUpDown className={`w-3.5 h-3.5 ${isSorted ? 'text-primary-600 dark:text-primary-400 opacity-100' : 'opacity-40'}`} />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans selection:bg-primary-200 selection:text-primary-900 dark:selection:bg-primary-900/80 dark:selection:text-primary-100 overflow-hidden relative flex flex-col">
      {/* Mesh Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-500/20 dark:bg-teal-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-teal-500/10 dark:bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md z-50 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Menyinkronkan Sistem...</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Membuat koneksi secara aman ke database.</p>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 h-screen w-full flex flex-col relative z-10">
          
        {/* Header Section */}
        <header className="bg-white/60 dark:bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-none rounded-lg md:rounded-xl border border-white/40 dark:border-white/10 p-4 md:p-5 mx-auto w-full mb-4 shrink-0 transition-colors">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Title & Status */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 flex items-center justify-center shadow-inner text-primary-600 dark:text-primary-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Database Registrasi Aplikasi Rapor Edi Brata</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  {user ? (
                    <span className="flex items-center gap-2 px-2.5 py-1 bg-teal-500/10 text-teal-400 text-[10px] font-bold rounded-md border border-teal-500/20 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                      Sinkronisasi Cloud Aktif
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-md border border-rose-500/20 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-rose-400 rounded-full"></div>
                      Sistem Luring
                    </span>
                  )}
                  {error && <span className="text-rose-400 text-[10px] uppercase font-bold tracking-widest border border-rose-500/20 px-2 py-1 rounded-md bg-rose-500/10">{error}</span>}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              
              {/* Contextual Delete Actions */}
              {selectedIds.size > 0 && (
                <div className="flex items-center px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md mr-1 backdrop-blur-md">
                  <span className="text-[11px] font-bold text-rose-500 mr-3">
                    {selectedIds.size} DIPILIH
                  </span>
                  <button 
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="relative group flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-primary-500 dark:group-focus-within:text-white transition-colors" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari NPSN, Nama, Alamat..." 
                  className="w-full pl-9 pr-3 py-2 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-md text-sm text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 focus:border-primary-400 dark:focus:border-primary-500 transition-all placeholder:text-slate-500 shadow-sm backdrop-blur-md"
                />
              </div>

              {/* Utilities */}
              <ActionMenu 
                allData={allData} 
                selectedIds={Array.from(selectedIds)} 
                onClearSelection={() => setSelectedIds(new Set())}
              />

              <div className="w-px h-6 bg-slate-200 dark:bg-white/10 hidden sm:block mx-1"></div>

              {/* Primary Call to Action */}
              <button 
                onClick={openAddMenu}
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-lg shadow-primary-500/25 border border-primary-500/50 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Tambah Data
              </button>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-9 h-9 flex items-center justify-center bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-md transition-all shadow-sm group backdrop-blur-md"
                aria-label="Pengaturan"
              >
                <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </header>

        {/* Table Area */}
        <div className="flex-1 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-lg md:rounded-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-none flex flex-col min-h-0 relative overflow-hidden transition-colors">
          
          <div className="p-3 md:p-4 border-b border-white/40 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/30 dark:bg-white/5 gap-2">
             <h3 className="text-sm font-semibold text-slate-800 dark:text-white tracking-tight">Struktur Direktori</h3>
             <div className="flex items-center gap-3">
               <span className="text-[11px] text-slate-500 dark:text-slate-400">Waktu Sistem: {new Date().toLocaleTimeString()}</span>
               <div className="w-px h-3 bg-slate-200 dark:bg-white/20"></div>
               <span className="px-2 py-0.5 bg-white/50 dark:bg-white/10 border border-white/60 dark:border-white/10 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider shadow-sm dark:shadow-none">{processedData.length} Entri</span>
             </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-2 bg-[#f8fafc] dark:bg-[#0f0f13] text-slate-600 dark:text-slate-400 sticky top-0 z-20 border-b border-slate-300 dark:border-white/10 w-16 text-center" style={{ backgroundClip: 'padding-box' }}>
                    <div className="relative flex items-center justify-center w-4 h-4 mx-auto">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === processedData.length && processedData.length > 0}
                        ref={input => {
                            if (input) {
                                input.indeterminate = selectedIds.size > 0 && selectedIds.size < processedData.length;
                            }
                        }}
                        onChange={toggleSelectAll}
                        className="peer shrink-0 appearance-none w-4 h-4 border border-slate-300 dark:border-white/20 rounded bg-white dark:bg-white/5 checked:bg-primary-500 checked:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer transition-all shadow-sm"
                      />
                      <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  </th>
                  <TableHeader label="No" width="60px" align="center" />
                  <TableHeader label="Timestamp" sortKey="timestamp" width="130px" align="center" />
                  <TableHeader label="Nama Sekolah" sortKey="nama-sekolah" />
                  <TableHeader label="NPSN" sortKey="npsn" width="100px" align="center" />
                  <TableHeader label="Alamat" />
                  <TableHeader label="Tipe Wilayah" width="120px" align="center" />
                  <TableHeader label="Desa/Kel" sortKey="desa-kelurahan-nama" />
                  <TableHeader label="Kecamatan" sortKey="kecamatan" />
                  <TableHeader label="Tipe Daerah" width="120px" align="center" />
                  <TableHeader label="Kab/Kota" sortKey="kabupaten-kota-nama" />
                  <TableHeader label="Provinsi" sortKey="provinsi" />
                </tr>
              </thead>
              <tbody className="text-sm">
                {processedData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-500">
                         <Search className="w-10 h-10 mb-3 opacity-20" />
                         <p className="font-medium text-slate-800 dark:text-white tracking-tight">No records located</p>
                         {search && <p className="text-xs mt-1 text-slate-500 flex items-center justify-center">Adjust search parameters.</p>}
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedData.map((item, index) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-white/50 dark:hover:bg-white/5 border-b border-slate-200/50 dark:border-white/5 transition-colors group cursor-default
                          ${isSelected ? 'bg-primary-50 dark:bg-primary-500/10 border-b-primary-200 dark:border-b-primary-500/20' : ''}
                        `}
                      >
                        <td className="px-3 py-2 text-center">
                          <div className="relative flex items-center justify-center w-4 h-4 mx-auto">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelectRow(item.id)}
                              className="peer shrink-0 appearance-none w-4 h-4 border border-slate-300 dark:border-white/20 rounded bg-white dark:bg-white/5 checked:bg-primary-500 checked:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer transition-all shadow-sm"
                            />
                            <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-500 tracking-wider">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {item.isDraft ? (
                             <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 rounded-md">DRAFT</span>
                          ) : formatDisplayDate(item.timestamp)}
                        </td>
                        <td 
                          className="px-3 py-2 font-semibold text-slate-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer hover:underline underline-offset-4 tracking-tight transition-colors"
                          onClick={() => openEditMenu(item)}
                        >
                          {highlightText(item['nama-sekolah'])}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-slate-600 dark:text-slate-400">
                          {highlightText(item.npsn)}
                        </td>
                        <td className="px-3 py-2 truncate max-w-[200px] text-slate-700 dark:text-slate-300" title={item.alamat}>
                          {highlightText(item.alamat)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {item['desa-kelurahan-jenis'] ? (
                             <span className="px-1.5 py-0.5 bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest shadow-sm dark:shadow-none">
                               {item['desa-kelurahan-jenis']}
                             </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{highlightText(item['desa-kelurahan-nama'])}</td>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{highlightText(item.kecamatan)}</td>
                        <td className="px-2 py-1.5 text-center">
                          {item['kabupaten-kota-jenis'] ? (
                             <span className="px-1.5 py-0.5 bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest shadow-sm dark:shadow-none">
                               {item['kabupaten-kota-jenis']}
                             </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{highlightText(item['kabupaten-kota-nama'])}</td>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{highlightText(item.provinsi)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Status Bar inside wrapper */}
          <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between text-[10px] font-medium text-slate-500 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div> Klik pada Nama Sekolah untuk mengubah data</span>
            </div>
            <div className="flex gap-4 tracking-wider">
               <span>Beban Sistem: 12%</span>
               <span>v4.8.2-stable</span>
            </div>
          </div>
        </div>
      </div>

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SchoolModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editData={editingSchool} 
        onSaveDraft={(data) => {
            setDrafts(prev => {
                const existing = prev.findIndex(p => p.id === data.id);
                if (existing >= 0) {
                    const newDrafts = [...prev];
                    newDrafts[existing] = data;
                    return newDrafts;
                }
                return [data, ...prev];
            });
        }}
        onCommittedDraft={(draftId) => {
             setDrafts(prev => prev.filter(p => p.id !== draftId));
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
