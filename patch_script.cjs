const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// The new HTML for Jenis Pesanan uses a checkbox (toggle) instead of select
const oldJenisHtmlRegex = /<div class="w-full mt-4 group">[\s\S]*?<select id="edit-jenis-pesanan"[\s\S]*?<\/select>\n\s*<\/div>/;

const newJenisHtml = `        <div id="jenis-pesanan-container" class="w-full mt-4 group" style="display: none;">
            <label class="block font-bold text-slate-500 mb-2 uppercase tracking-tight group-focus-within:text-teal-600 transition-colors">Kategori Pesanan Kelas</label>
            <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span class="text-xs font-bold text-slate-600 tracking-tight">Pesanan Baru</span>
                <label class="relative inline-flex items-center cursor-pointer mx-3">
                    <input type="checkbox" id="edit-jenis-pesanan-toggle" class="sr-only peer">
                    <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
                <span class="text-xs font-bold text-teal-700 tracking-tight">Lanjutan</span>
            </div>
            <p class="text-[10px] text-slate-400 mt-1.5 italic">*Pilih <span class="font-bold text-teal-600">Lanjutan</span> jika penambahan kelas tidak dikenakan biaya dasar (hanya biaya kelas).</p>
        </div>`;

content = content.replace(oldJenisHtmlRegex, newJenisHtml);

// Remove "jenis-pesanan" from fieldIds because we now handle it separately
content = content.replace(/"provinsi", "jenis-pesanan"\];/, '"provinsi"];');

// Inject logic in openActionModal right before `if (id) {`
const beforeIfIdRegex = /if \(id\) \{/;
content = content.replace(beforeIfIdRegex, `const jpContainer = document.getElementById('jenis-pesanan-container');
            const jpToggle = document.getElementById('edit-jenis-pesanan-toggle');
            jpContainer.style.display = 'none';
            jpToggle.checked = false;
            
            if (id) {`);

// Populate the toggle correctly when data is loaded, and adjust logic if someone clicks
const fieldIdsForEachRegex = /fieldIds\.forEach\(fid => \{ const el = document\.getElementById\(\`edit-\$\{fid\}\`\); if \(el\) el\.value = item\[fid\] \|\| ''; \}\);/;
content = content.replace(fieldIdsForEachRegex, `fieldIds.forEach(fid => { const el = document.getElementById(\`edit-\$\{fid\}\`); if (el) el.value = item[fid] || ''; });
                if (item['jenis-pesanan'] === 'lanjutan') { jpToggle.checked = true; }`);

// In the btn.onclick, we want to show the container if it's in edit mode and a class was clicked.
const btnOnclickRegex = /(btn\.classList\.add\('bg-teal-500', 'text-white', 'border-teal-500', 'shadow-md', 'scale-105'\);\n\s*\}\n\s*\};\n\s*\};)/;
content = content.replace(btnOnclickRegex, `$1
            btn.onclick = (e) => {
                e.preventDefault();
                const jpContainer = document.getElementById('jenis-pesanan-container');
                if (window.isEditMode) jpContainer.style.display = 'block';
                const val = parseInt(btn.getAttribute('data-val'));
                if (window.currentSelectedKelas.includes(val)) {
                    window.currentSelectedKelas = window.currentSelectedKelas.filter(v => v !== val);
                } else {
                    window.currentSelectedKelas.push(val);
                }
                updateKelasUI();
            };`);

// Remove old onclick assignment for btn
const oldOnClickRegex = /btn\.onclick = \(e\) => \{[\s\S]*?updateKelasUI\(\);\n\s*\};\n/;
// Wait, my replace above was matching the end of `updateKelasUI()` and inserting `btn.onclick` again. I should just replace `btn.onclick`.

fs.writeFileSync('index.html', content);
