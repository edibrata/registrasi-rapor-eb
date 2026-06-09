const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// replace how renderTable processes data for Tab 1 and Tab 2
let newRenderCode = `
            const tagihanTableBody = document.getElementById('tagihan-table-body');
            if (tagihanTableBody) tagihanTableBody.innerHTML = '';
            let totalBTagihan = 0;
            
            // Build unique schools for Tab 1 (Data Pokok)
            const uniqueSchoolsMap = new Map();
            dataToDisplay.forEach(item => {
                const key = item.npsn ? String(item.npsn).trim().toLowerCase() : (item['nama-sekolah'] ? String(item['nama-sekolah']).trim().toLowerCase() : Math.random().toString());
                if (!uniqueSchoolsMap.has(key)) {
                    uniqueSchoolsMap.set(key, item);
                } else {
                    const existing = uniqueSchoolsMap.get(key);
                    const ts1 = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
                    const ts2 = item.timestamp ? new Date(item.timestamp).getTime() : 0;
                    if (ts2 > ts1) {
                        uniqueSchoolsMap.set(key, item);
                    }
                }
            });
            const uniqueSchools = Array.from(uniqueSchoolsMap.values());
            schoolCount.textContent = uniqueSchools.length;
            
            if (dataToDisplay.length === 0) {
                tableBody.innerHTML = \`<tr><td colspan="12" class="text-center py-16 bg-slate-50 border-t border-slate-100">
                    <div class="flex flex-col items-center justify-center opacity-75">
                        <svg viewBox="0 0 24 24" stroke="currentColor" class="w-12 h-12 text-slate-300 mb-3"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 15h10M2 18h10M2 12h10"></path></svg>
                        <h3 class="text-slate-500 font-bold mb-1 text-[13px]">Belum Ada Data</h3>
                        <p class="text-slate-400 text-[10px]">Klik tombol <span class="font-bold text-teal-500">Tambah</span> untuk memulai registrasi baru.</p>
                    </div>
                </td></tr>\`;
                if (tagihanTableBody) tagihanTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400">Tidak ada data pesanan</td></tr>';
            } else {
                // Render Tagihan Table
                dataToDisplay.forEach((item, index) => {
                    if (tagihanTableBody) {
                        const tagihanRow = document.createElement('tr');
                        const tsStr = item.isDraft ? '<span class="text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded">DRAFT</span>' : formatDisplayDate(item.timestamp);
                        const kCount = Array.isArray(item.kelas) ? item.kelas.length : 0;
                        let biaya = 0;
                        if (kCount > 0) biaya = 50000 + (kCount * 50000);
                        totalBTagihan += biaya;
                        
                        tagihanRow.innerHTML = \`
                            <td class="px-4 py-2 text-center text-slate-400 sticky left-0 bg-white border-r border-slate-100">\${index + 1}</td>
                            <td class="px-4 py-2 text-center text-slate-500 font-mono sticky left-[50px] bg-white border-r border-slate-100">\${tsStr}</td>
                            <td class="px-4 py-2 font-bold text-slate-800 sticky left-[180px] bg-white border-r border-slate-200/80 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">\${item['nama-sekolah'] || '-'}</td>
                            <td class="px-4 py-2 text-center font-mono text-slate-500">\${item['npsn'] || '-'}</td>
                            <td class="px-4 py-2 text-center">
                                <div class="flex flex-wrap items-center justify-center gap-1">
                                    \${(Array.isArray(item.kelas) ? item.kelas.sort() : []).map(k => \`<div class="w-4 h-4 bg-teal-100 text-teal-800 rounded font-bold text-[9px] flex items-center justify-center shadow-sm">\${k}</div>\`).join('') || '<span class="text-slate-300 italic text-xs">Belum ada</span>'}
                                </div>
                            </td>
                            <td class="px-4 py-2 text-right font-mono font-bold text-slate-700">Rp \${biaya.toLocaleString('id-ID')}</td>
                        \`;
                        tagihanTableBody.appendChild(tagihanRow);
                    }
                });
                
                if (document.getElementById('tagihan-total')) {
                    document.getElementById('tagihan-total').textContent = 'Rp ' + totalBTagihan.toLocaleString('id-ID');
                }

                // Render Data Pokok Table
                uniqueSchools.forEach((item, index) => {
`;

content = content.replace(/const tagihanTableBody = document\.getElementById[\s\S]*?const isSelected = selectedIds\.has\(item\.id\);/, newRenderCode + "\n                    const isSelected = selectedIds.has(item.id);");

content = content.replace(/\s*tableBody\.appendChild\(row\);\s*\}\);\s*if \(document\.getElementById\('tagihan-total'\)\) \{\s*document\.getElementById\('tagihan-total'\)\.textContent = 'Rp ' \+ totalBTagihan\.toLocaleString\('id-ID'\);\s*\}\s*\}\s*\}/, "\n                    tableBody.appendChild(row);\n                });\n            }\n        }");

fs.writeFileSync('index.html', content);
