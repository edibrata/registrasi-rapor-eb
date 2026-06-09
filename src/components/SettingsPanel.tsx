import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeContext';
import { Palette, Moon, Sun, Monitor } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { color, mode, setColor, setMode } = useTheme();

  const themes = [
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
    { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md z-50 transition-opacity"
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-l border-white/60 dark:border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-5 border-b border-white/60 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary-500" />
                Pengaturan Tampilan
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {/* Tema Warna */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">Palet Warna Utama</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pilih warna aksen untuk elemen utama.</p>
                </div>
                <div className="flex gap-4">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setColor(t.id)}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        t.bg,
                        color === t.id ? "ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-300 ring-offset-white dark:ring-offset-slate-900 scale-110 shadow-md" : "hover:scale-105"
                      )}
                      title={t.label}
                    />
                  ))}
                </div>
              </div>

              {/* Mode Gelap */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">Mode Layar</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pilih tema terang, gelap, atau ikuti sistem.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md rounded-lg">
                  <button
                    onClick={() => setMode('light')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-md text-xs font-medium transition-all shadow-sm",
                      mode === 'light' 
                        ? "bg-white dark:bg-slate-700 text-primary-600" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 shadow-none"
                    )}
                  >
                    <Sun className="w-5 h-5" />
                    Terang
                  </button>
                  <button
                    onClick={() => setMode('dark')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-md text-xs font-medium transition-all shadow-sm",
                      mode === 'dark' 
                        ? "bg-white dark:bg-slate-700 text-primary-600" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 shadow-none"
                    )}
                  >
                    <Moon className="w-5 h-5" />
                    Gelap
                  </button>
                  <button
                    onClick={() => setMode('system')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-md text-xs font-medium transition-all shadow-sm",
                      mode === 'system' 
                        ? "bg-white dark:bg-slate-700 text-primary-600" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 shadow-none"
                    )}
                  >
                    <Monitor className="w-5 h-5" />
                    Sistem
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
