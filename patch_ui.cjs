const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Add Edit Option Modal to UI before action-modal
const actionModalPos = content.indexOf('<div id="action-modal" class="modal-overlay">');
const editTypeModal = `
    <!-- Modal Pilihan Edit -->
    <div id="edit-type-modal" class="modal-overlay">
      <div class="bg-white p-6 rounded-2xl w-full max-w-sm mx-4 transform transition-all scale-100 opacity-100 shadow-2xl relative">
        <button onclick="document.getElementById('edit-type-modal').classList.remove('active')" class="absolute p-2 transition-colors rounded-full top-3 right-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <div class="text-center mb-6">
            <div class="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </div>
            <h3 class="text-lg font-bold text-slate-800">Pilih Mode Edit</h3>
            <p class="text-xs text-slate-500 mt-1">Sesuaikan informasi yang ingin Anda perbarui.</p>
        </div>
        <div class="flex flex-col gap-3">
            <button onclick="openActionModalObj(window.currentEditId, 'data')" class="group flex items-center p-3 sm:p-4 text-left bg-slate-50 border border-slate-200 rounded-xl hover:border-teal-400 hover:shadow-md transition-all">
                <div class="w-8 h-8 rounded bg-white text-slate-400 flex items-center justify-center mr-3 sm:mr-4 group-hover:text-teal-600 group-hover:bg-teal-50"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg></div>
                <div>
                    <h4 class="font-bold text-slate-700 text-sm group-hover:text-teal-700">Edit Data Profil</h4>
                    <p class="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Edit nama, NPSN, dan alamat sekolah.</p>
                </div>
            </button>
            <button onclick="openActionModalObj(window.currentEditId, 'pesanan')" class="group flex items-center p-3 sm:p-4 text-left bg-slate-50 border border-slate-200 rounded-xl hover:teal-400 hover:border-teal-400 hover:shadow-md transition-all">
                <div class="w-8 h-8 rounded bg-white text-slate-400 flex items-center justify-center mr-3 sm:mr-4 group-hover:text-teal-600 group-hover:bg-teal-50"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>
                <div>
                    <h4 class="font-bold text-slate-700 text-sm group-hover:text-teal-700">Edit Pesanan Kelas</h4>
                    <p class="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Ubah daftar kelas, hapus,/tambah.</p>
                </div>
            </button>
        </div>
      </div>
    </div>
    
    <!-- Modal History -->
    <div id="history-modal" class="modal-overlay">
      <div class="bg-white p-6 rounded-2xl w-full max-w-sm mx-4 transform transition-all scale-100 opacity-100 shadow-2xl relative">
        <button onclick="document.getElementById('history-modal').classList.remove('active')" class="absolute p-2 transition-colors rounded-full top-3 right-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <div class="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
            <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
                <h3 class="text-base font-bold text-slate-800 leading-tight">History Pembaruan</h3>
                <p class="text-[10px] font-mono text-slate-500" id="history-npsn"></p>
            </div>
        </div>
        <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1" id="history-list">
            <!-- Timestamps injected here -->
        </div>
      </div>
    </div>
`;
content = content.slice(0, actionModalPos) + editTypeModal + content.slice(actionModalPos);

fs.writeFileSync('index.html', content);
