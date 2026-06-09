const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const newRenderCode = `
            const tagihanTableBody = document.getElementById('tagihan-table-body');
            if (tagihanTableBody) tagihanTableBody.innerHTML = '';
            let totalBTagihan = 0;
            
            // Build unique schools for Tab 1 (Data Pokok)
            const uniqueSchoolsMap = new Map();
            dataToDisplay.forEach(item => {
                const key = item.npsn ? String(item.npsn).trim().toLowerCase() : (item['nama-sekolah'] ? String(item['nama-sekolah']).trim().toLowerCase() : Math.random().toString());
                if (!uniqueSchoolsMap.has(key)) {
                    uniqueSchoolsMap.set(key, { ...item, allTimestamps: [item] });
                } else {
                    const existing = uniqueSchoolsMap.get(key);
                    existing.allTimestamps.push(item);
                    
                    const ts1 = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
                    const ts2 = item.timestamp ? new Date(item.timestamp).getTime() : 0;
                    if (ts2 > ts1) {
                         // metadata is from the latest entry
                         uniqueSchoolsMap.set(key, { ...item, allTimestamps: existing.allTimestamps });
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
                        
                        const jenisPsn = item['jenis-pesanan'] || 'pesanan_baru';
                        if (jenisPsn === 'lanjutan') {
                             biaya = kCount * 50000;
                        } else {
                             if (kCount > 0) biaya = 50000 + (kCount * 50000);
                        }
                        
                        totalBTagihan += biaya;
                        
                        const jenisBadge = jenisPsn === 'lanjutan' 
                              ? '<span class="ml-1 text-[8px] bg-indigo-100 text-indigo-600 px-1 py-0.5 rounded uppercase font-bold">Lanjutan</span>'
                              : '<span class="ml-1 text-[8px] bg-teal-100 text-teal-600 px-1 py-0.5 rounded uppercase font-bold">Baru</span>';

                        tagihanRow.innerHTML = \`
                            <td class="px-4 py-2 text-center text-slate-400 sticky left-0 bg-white border-r border-slate-100">\${index + 1}</td>
                            <td class="px-4 py-2 text-center text-slate-500 font-mono sticky left-[50px] bg-white border-r border-slate-100">\${tsStr}</td>
                            <td class="px-4 py-2 font-bold text-slate-800 sticky left-[180px] bg-white border-r border-slate-200/80 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">\${item['nama-sekolah'] || '-'} \${jenisBadge}</td>
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

// Replace the block from `const tagihanTableBody` to `uniqueSchools.forEach`
const replaceRegex = /const tagihanTableBody = document\.getElementById[\s\S]*?uniqueSchools\.forEach\(\(item, index\) => \{/;
content = content.replace(replaceRegex, newRenderCode);

// Next we need to replace the html row inside `uniqueSchools.forEach` to use `allTimestamps`.

const newRowRender = `
                    const isSelected = selectedIds.has(item.id);

                    const row = document.createElement('tr');
                    if (isSelected) row.classList.add('selected');
                    
                    const tsHtml = (item.allTimestamps || [item]).sort((a,b) => (b.timestamp||0) - (a.timestamp||0)).map(t => 
                           \`<div class="mb-0.5 border-b border-slate-100 pb-0.5 last:border-0 last:pb-0 \${t.isDraft?'bg-amber-50':''}">\${t.isDraft ? '<span class="bg-amber-100 border border-amber-200 text-amber-600 px-1 py-0.5 rounded shadow-sm font-bold tracking-tight text-[8px]">DRAFT</span>' : formatDisplayDate(t.timestamp)}</div>\`
                    ).join('');

                    row.innerHTML = \`
                        <td class="text-center align-top py-2"><input type="checkbox" \${isSelected ? 'checked' : ''} onchange="toggleRowSelection('\${item.id}')"></td>
                        <td class="text-center font-bold text-slate-400 border-r border-slate-100 align-top py-2">\${index + 1}</td>
                        <td class="text-[9.5px] text-slate-500 font-mono text-center align-top py-2">
                            \${tsHtml}
                        </td>
                        <td class="font-bold text-teal-700 cursor-pointer transition-all hover:underline hover:text-teal-900 underline-offset-4 decoration-teal-300 decoration-2 align-top py-2">\${highlightText(item['nama-sekolah'], searchVal)}</td>
                        <td class="font-mono text-slate-500 text-center align-top py-2">\${highlightText(item['npsn'], searchVal)}</td>
                        <td class="max-w-[150px] truncate align-top py-2" title="\${item['alamat']}">\${highlightText(item['alamat'], searchVal)}</td>
                        <td class="text-[10px] text-slate-500 capitalize text-center align-top py-2">\${highlightText(item['desa-kelurahan-jenis'], searchVal) || '-'}</td>
                        <td class="align-top py-2">\${highlightText(item['desa-kelurahan-nama'], searchVal)}</td>
                        <td class="align-top py-2">\${highlightText(item['kecamatan'], searchVal)}</td>
                        <td class="text-[10px] text-slate-500 capitalize text-center align-top py-2">\${highlightText(item['kabupaten-kota-jenis'], searchVal) || '-'}</td>
                        <td class="align-top py-2">\${highlightText(item['kabupaten-kota-nama'], searchVal)}</td>
                        <td class="align-top py-2">\${highlightText(item['provinsi'], searchVal)}</td>
                    \`;
                    row.querySelector('td:nth-child(4)').onclick = () => openActionModal(item.id);
                    tableBody.appendChild(row);
                });
`;

const innerReplaceRegex = /const isSelected = selectedIds\.has[\s\S]*?tableBody\.appendChild\(row\);\s*\}\);/
content = content.replace(innerReplaceRegex, newRowRender);

fs.writeFileSync('index.html', content);
