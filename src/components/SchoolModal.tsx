import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SchoolData } from '../types';
import { Building2, Plus, Copy, Trash2, X } from 'lucide-react';
import { addDoc, updateDoc, deleteDoc, getDbDocPath, getDbCollectionPath } from '../lib/firebase';
import { useToast } from './Toast';

interface SchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: SchoolData | null;
  onSaveDraft: (data: SchoolData) => void;
  onCommittedDraft: (draftId: string) => void;
}

const initialForm = {
  'nama-sekolah': '',
  npsn: '',
  alamat: '',
  'desa-kelurahan-jenis': '',
  'desa-kelurahan-nama': '',
  kecamatan: '',
  'kabupaten-kota-jenis': '',
  'kabupaten-kota-nama': '',
  provinsi: ''
};

export function SchoolModal({ isOpen, onClose, editData, onSaveDraft, onCommittedDraft }: SchoolModalProps) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  
  const isEditMode = !!editData && !editData.isDraft;
  const isEditDraft = !!editData && editData.isDraft;

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setForm({
          'nama-sekolah': editData['nama-sekolah'] || '',
          npsn: editData.npsn || '',
          alamat: editData.alamat || '',
          'desa-kelurahan-jenis': editData['desa-kelurahan-jenis'] || '',
          'desa-kelurahan-nama': editData['desa-kelurahan-nama'] || '',
          kecamatan: editData.kecamatan || '',
          'kabupaten-kota-jenis': editData['kabupaten-kota-jenis'] || '',
          'kabupaten-kota-nama': editData['kabupaten-kota-nama'] || '',
          provinsi: editData.provinsi || ''
        });
      } else {
        setForm(initialForm);
      }
    }
  }, [isOpen, editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const required = ['nama-sekolah', 'npsn', 'alamat'];
    const isValid = required.every(key => !!form[key as keyof typeof form]);
    if (!isValid) {
      showToast("Mohon lengkapi bagian Nama, NPSN, dan Alamat.", "error");
    }
    return isValid;
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    onSaveDraft({
        ...form,
        id: editData?.id || `draft-${Date.now()}`,
        timestamp: editData?.timestamp || Date.now(),
        isDraft: true
    } as SchoolData);
    showToast("Data disimpan sebagai Draft.", "success");
    onClose();
  };

  const handleSave = async (closeAfterSave = true) => {
    if (!validate()) return;
    setIsSubmitting(true);
    
    try {
      if (isEditMode && editData?.id) {
        await updateDoc(getDbDocPath(editData.id), form);
        showToast("Perubahan data berhasil disimpan.", "success");
      } else {
        await addDoc(getDbCollectionPath(), { ...form, timestamp: Date.now() });
        showToast("Sekolah baru berhasil ditambahkan.", "success");
        if (isEditDraft && editData?.id) {
           onCommittedDraft(editData.id);
        }
      }
      
      if (closeAfterSave) {
        onClose();
      } else {
        setForm(initialForm);
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan saat menyimpan data.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsSubmitting(true);
    try {
        await addDoc(getDbCollectionPath(), { ...form, 'nama-sekolah': `${form['nama-sekolah']} (Salinan)`, timestamp: Date.now() });
        showToast("Data berhasil diduplikat.", "success");
        onClose();
    } catch (e) {
        showToast("Gagal menduplikat data.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !editData?.id) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini selamanya?")) {
        setIsSubmitting(true);
        try {
            await deleteDoc(getDbDocPath(editData.id));
            showToast("Data berhasil dihapus.", "success");
            onClose();
        } catch (e) {
            showToast("Gagal menghapus data.", "error");
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  const InputLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="fixed inset-0 bg-slate-900/40 dark:bg-[#0a0a0c]/80 backdrop-blur-md z-[100] transition-opacity"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-white/80 dark:bg-[#0f0f13]/90 backdrop-blur-2xl rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-2xl w-full max-w-3xl overflow-hidden pointer-events-auto border border-white/60 dark:border-white/10 flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-300"
            >
              {/* Header */}
              <div className="flex justify-between items-start p-6 border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-inner border border-white/60 dark:border-white/10 ${isEditMode ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                    {isEditMode ? <Building2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {isEditMode ? "Edit Profil Sekolah" : "Registrasi Satuan Pendidikan"}
                    </h2>
                    {isEditMode && (
                       <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 flex items-center gap-2 font-bold">
                           ID: <span className="text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded border border-white/60 dark:border-white/5">{editData?.id}</span>
                       </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <InputLabel required>Nama Satuan Pendidikan</InputLabel>
                    <input 
                        type="text" 
                        name="nama-sekolah" 
                        value={form['nama-sekolah']} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-md text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600 backdrop-blur-md shadow-sm"
                        placeholder="Contoh: SDN Nusantara"
                    />
                  </div>
                  <div>
                    <InputLabel required>NPSN</InputLabel>
                    <input 
                        type="text" 
                        name="npsn" 
                        value={form.npsn} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600 backdrop-blur-md shadow-sm"
                        placeholder="8 Digit NPSN"
                    />
                  </div>
                </div>

                <div>
                  <InputLabel required>Alamat Lengkap</InputLabel>
                  <input 
                      type="text" 
                      name="alamat" 
                      value={form.alamat} 
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600 backdrop-blur-md shadow-sm"
                      placeholder="Jalan, RT/RW, Dusun"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <InputLabel>Kel/Desa</InputLabel>
                    <select 
                        name="desa-kelurahan-jenis" 
                        value={form['desa-kelurahan-jenis']} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900 border border-white/60 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 outline-none appearance-none backdrop-blur-md shadow-sm"
                    >
                        <option value="">Pilih</option>
                        <option value="Desa">Desa</option>
                        <option value="Kelurahan">Kelurahan</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <InputLabel>Nama Kel/Desa</InputLabel>
                    <input 
                        type="text" 
                        name="desa-kelurahan-nama" 
                        value={form['desa-kelurahan-nama']} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 backdrop-blur-md shadow-sm"
                        placeholder="Nama Desa/Kelurahan"
                    />
                  </div>
                   <div>
                    <InputLabel>Kecamatan</InputLabel>
                    <input 
                        type="text" 
                        name="kecamatan" 
                        value={form.kecamatan} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 backdrop-blur-md shadow-sm"
                        placeholder="Nama Kecamatan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <InputLabel>Kab/Kota</InputLabel>
                    <select 
                        name="kabupaten-kota-jenis" 
                        value={form['kabupaten-kota-jenis']} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900 border border-white/60 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 outline-none appearance-none backdrop-blur-md shadow-sm"
                    >
                        <option value="">Pilih</option>
                        <option value="Kabupaten">Kabupaten</option>
                        <option value="Kota">Kota</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <InputLabel>Nama Kab/Kota</InputLabel>
                    <input 
                        type="text" 
                        name="kabupaten-kota-nama" 
                        value={form['kabupaten-kota-nama']} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 backdrop-blur-md shadow-sm"
                        placeholder="Nama Kab/Kota"
                    />
                  </div>
                   <div>
                    <InputLabel>Provinsi</InputLabel>
                    <input 
                        type="text" 
                        name="provinsi" 
                        value={form.provinsi} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/50 outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 backdrop-blur-md shadow-sm"
                        placeholder="Nama Provinsi"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {(isEditMode || isEditDraft) && (
                        <>
                            <button
                                onClick={isEditDraft ? () => {
                                    onCommittedDraft(editData!.id);
                                    onClose();
                                    showToast("Draft dihapus.", "success");
                                } : handleDelete}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 rounded-md flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                            {!isEditDraft && (
                                <button
                                    onClick={handleDuplicate}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-xs font-bold text-primary-400 hover:text-white hover:bg-primary-500/20 border border-transparent hover:border-primary-500/30 rounded-md flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Copy className="w-4 h-4" /> Duplikat
                                </button>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 border border-white/60 dark:border-transparent hover:border-white/60 dark:hover:border-white/10 rounded-md transition-all disabled:opacity-50"
                    >
                        Batal
                    </button>
                    {!isEditMode && (
                        <button
                            onClick={handleSaveDraft}
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-md transition-all disabled:opacity-50 border border-white/60 dark:border-white/10 shadow-sm"
                        >
                            Simpan Draft
                        </button>
                    )}
                    {!isEditMode && !isEditDraft && (
                        <button
                            onClick={() => handleSave(false)}
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-md transition-all disabled:opacity-50 border border-white/60 dark:border-white/10 shadow-sm"
                        >
                            Simpan & Tambah
                        </button>
                    )}
                    <button
                        onClick={() => handleSave(true)}
                        disabled={isSubmitting}
                        className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-500/25 border border-primary-500/50 rounded-md transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Konfirmasi'}
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
