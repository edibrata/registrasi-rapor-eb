import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, Database, RotateCcw } from 'lucide-react';
import { SchoolData } from '../types';
import { cn, getTimestamp, formatDisplayDate } from '../lib/utils';
import { getDbCollectionPath, addDoc, doc, writeBatch, db } from '../lib/firebase';
import { useToast } from './Toast';

interface TooltipButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'outline' | 'slate' | 'danger';
  className?: string;
}

function TooltipButton({ icon: Icon, label, onClick, variant = 'primary', className }: TooltipButtonProps) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-md transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100 border border-transparent",
          variant === 'primary' && "bg-primary-600/80 text-white hover:bg-primary-500 border-primary-500/50",
          variant === 'success' && "bg-emerald-600/80 text-white hover:bg-emerald-500 border-emerald-500/50",
          variant === 'outline' && "bg-slate-200/50 dark:bg-white/5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-300/50 dark:hover:bg-white/10 border-slate-300 dark:border-white/10",
          variant === 'slate' && "bg-slate-300/50 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-400/50 dark:hover:bg-white/20 border-slate-400/50 dark:border-white/10",
          variant === 'danger' && "bg-rose-600/80 text-white hover:bg-rose-500 border-rose-500/50",
          className
        )}
      >
        <Icon className="w-4 h-4" />
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-white text-[10px] font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-white"></div>
      </div>
    </div>
  );
}

const excelColumns = [
  { id: "timestamp", label: "Timestamp" },
  { id: "nama-sekolah", label: "Nama Sekolah" },
  { id: "npsn", label: "NPSN" },
  { id: "alamat", label: "Alamat Lengkap" },
  { id: "desa-kelurahan-jenis", label: "Jenis Desa/Kel" },
  { id: "desa-kelurahan-nama", label: "Nama Desa/Kel" },
  { id: "kecamatan", label: "Kecamatan" },
  { id: "kabupaten-kota-jenis", label: "Jenis Kab/Kota" },
  { id: "kabupaten-kota-nama", label: "Nama Kab/Kota" },
  { id: "provinsi", label: "Provinsi" },
  { id: "kelas", label: "Kelas" }
] as const;

export function ActionMenu({ allData, selectedIds, onClearSelection }: { allData: SchoolData[], selectedIds: string[], onClearSelection: () => void }) {
  const { showToast } = useToast();
  
  const handleDownloadTemplate = () => {
    const headers = excelColumns.map(col => col.label);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database");
    XLSX.writeFile(wb, `Template_Database_${getTimestamp()}.xlsx`);
    showToast("Template berhasil diunduh.", "success");
  };

  const handleExportExcel = () => {
    if (allData.length === 0) {
      showToast("Tidak ada data untuk diekspor.", "error");
      return;
    }
    
    const dataToExport = selectedIds.length > 0 
      ? allData.filter(d => selectedIds.includes(d.id)) 
      : allData;
      
    const headers = excelColumns.map(col => col.label);
    const rows = dataToExport.map(item => excelColumns.map(col => {
      if (col.id === 'timestamp') return formatDisplayDate(item.timestamp);
      if (col.id === 'kelas') {
        const k = (item as any)[col.id];
        return Array.isArray(k) ? k.join(", ") : "";
      }
      return (item as any)[col.id] || "";
    }));
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database");
    XLSX.writeFile(wb, `Ekspor_Database_${getTimestamp()}.xlsx`);
    showToast(selectedIds.length > 0 ? "Data terpilih berhasil diekspor." : "Seluruh database berhasil diekspor.", "success");
  };

  const handleImportExcel = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      showToast("Sedang memproses file excel...", "info");
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const buffer = evt.target?.result;
          if (!buffer) return;
          const wb = XLSX.read(new Uint8Array(buffer as ArrayBuffer), {type: 'array'});
          const data = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]]);
          
          let importCount = 0;
          for (const row of data) {
            const item: Partial<SchoolData> = { timestamp: Date.now() };
            excelColumns.forEach(col => { 
                if(col.id === 'kelas') {
                    const val = row[col.label] || row[col.id];
                    if (typeof val === 'string') {
                         (item as any)[col.id] = val.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                    } else if (typeof val === 'number') {
                         (item as any)[col.id] = [val];
                    } else {
                         (item as any)[col.id] = [];
                    }
                } else if(col.id !== 'timestamp') {
                    (item as any)[col.id] = row[col.label] || row[col.id] || ""; 
                }
            });
            if (item['nama-sekolah']) {
                await addDoc(getDbCollectionPath(), item);
                importCount++;
            }
          }
          showToast(`Berhasil mengimpor ${importCount} baris data!`, "success");
        } catch (error) {
          console.error(error);
          showToast("Gagal memproses file excel.", "error");
        }
      };
      reader.readAsArrayBuffer(file);
    };
    fileInput.click();
  };

  const handleBackup = () => {
    if (allData.length === 0) {
        showToast("Tidak ada data untuk dibackup.", "error");
        return;
    }
    const dataStr = JSON.stringify(allData.map(({id, ...r}) => r), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Database_${getTimestamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("File backup JSON berhasil diunduh.", "success");
  };

  const handleRestore = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      showToast("Sedang memulihkan data...", "info");
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
              const result = evt.target?.result as string;
              const data = JSON.parse(result);
              let restoreCount = 0;
              for (const item of data) {
                  if (item['nama-sekolah']) {
                      await addDoc(getDbCollectionPath(), { ...item, timestamp: Date.now() });
                      restoreCount++;
                  }
              }
              showToast(`Restorasi berhasil! ${restoreCount} data dipulihkan.`, "success");
          } catch (err) { 
              showToast("File JSON tidak valid.", "error"); 
          }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1.5 p-1.5 bg-white/60 dark:bg-white/5 rounded-md border border-white/60 dark:border-white/10 backdrop-blur-md shadow-sm">
          <TooltipButton icon={Download} label="Unduh Template" onClick={handleDownloadTemplate} variant="outline" />
          <TooltipButton icon={Upload} label="Impor Excel" onClick={handleImportExcel} variant="success" />
          <TooltipButton icon={Database} label="Ekspor Excel" onClick={handleExportExcel} variant="success" />
      </div>
      
      <div className="flex gap-1.5 p-1.5 bg-white/60 dark:bg-white/5 rounded-md border border-white/60 dark:border-white/10 backdrop-blur-md shadow-sm">
          <TooltipButton icon={Database} label="Cadangkan Data" onClick={handleBackup} variant="slate" />
          <TooltipButton icon={RotateCcw} label="Pulihkan Data" onClick={handleRestore} variant="outline" />
      </div>
    </div>
  );
}
