const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Replace the select dropdown with a toggle UI
const oldJenisHtml = `        <div class="w-full mt-4 group">
            <label class="block font-bold text-slate-500 mb-1.5 uppercase tracking-tight group-focus-within:text-teal-600 transition-colors">Jenis Pesanan</label>
            <select id="edit-jenis-pesanan" class="py-2.5 px-3 w-full bg-slate-50 border border-slate-200 focus:border-teal-400 rounded-lg outline-none font-bold text-slate-600">
                <option value="pesanan_baru">Pesanan Baru (Biaya Dasar + Kelas)</option>
                <option value="lanjutan">Lanjutan (Hanya Harga Kelas)</option>
            </select>
        </div>`;

const newJenisHtml = `        <div id="jenis-pesanan-container" class="w-full mt-4 group" style="display: none;">
            <label class="block font-bold text-slate-500 mb-2 uppercase tracking-tight group-focus-within:text-teal-600 transition-colors">Kategori Pesanan Kelas</label>
            <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span class="text-xs font-bold text-slate-600 tracking-tight">Pesanan Baru</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="edit-jenis-pesanan-toggle" class="sr-only peer">
                    <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
                <span class="text-xs font-bold text-teal-700 tracking-tight">Lanjutan</span>
            </div>
            <p class="text-[10px] text-slate-400 mt-1.5 italic">*Pilih <span class="font-bold text-teal-600">Lanjutan</span> jika penambahan kelas tidak dikenakan biaya dasar (hanya biaya kelas).</p>
        </div>`;

content = content.replace(oldJenisHtml, newJenisHtml);

// 2. Remove 'jenis-pesanan' from fieldIds
content = content.replace(/"provinsi", "jenis-pesanan"\];/, '"provinsi"];');

// 3. Inject logic in openActionModal
// Around `const editIdInput = document.getElementById('edit-id');` on line ~774
const reOpen = /(const editIdInput = document.getElementById\('edit-id'\);)/;
content = content.replace(reOpen, `$1\n            const jpContainer = document.getElementById('jenis-pesanan-container');\n            const jpToggle = document.getElementById('edit-jenis-pesanan-toggle');\n            jpContainer.style.display = 'none';\n            jpToggle.checked = false;\n            window.isEditMode = (id !== null);`);

// 4. Inject logic to show toggle on click `kelas-btn`
// In btn.onclick = (e) => { ... window.currentSelectedKelas = ... }
const reKelasClick = /(btn\.onclick = \(e\) => \{[\s\S]*?updateKelasUI\(\);\n)/;
content = content.replace(reKelasClick, `$1                if (window.isEditMode) { document.getElementById('jenis-pesanan-container').style.display = 'block'; }\n`);

// 5. Inject logic to populate jpToggle in openActionModal for existing data
// Around `if (item) { displayId.textContent = item.id;` lines ~810... Wait, I need to see where `if (item) {` is.
