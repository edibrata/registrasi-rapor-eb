const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Replace table body row generation
content = content.replace(/<td class="text-center">\s*<div class="flex items-center justify-center gap-0\.5">\s*\$\{\[1, 2, 3, 4, 5, 6\]\.map\(k => \{\s*const hasClass = Array\.isArray\(item\.kelas\) && item\.kelas\.includes\(k\);\s*return \`<div class="w-3\.5 h-3\.5 flex items-center justify-center rounded-\[3px\] text-\[8px\] font-bold \$\{hasClass \? 'bg-teal-500 text-white shadow-\[0_2px_4px_-1px_rgba\(20,184,166,0\.5\)\]' : 'bg-slate-100\/50 text-slate-300'\}\">\$\{k\}<\/div>\`;\s*\}\)\.join\(''\)\}\s*<\/div>\s*<\/td>/, "");

// Add tagihan rendering inside renderTable
const renderTagihanCode = `
            const tagihanTableBody = document.getElementById('tagihan-table-body');
            if (tagihanTableBody) tagihanTableBody.innerHTML = '';
            let totalBTagihan = 0;
            
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
                dataToDisplay.forEach((item, index) => {
`;

// Replace lines from if (dataToDisplay.length === 0) up to dataToDisplay.forEach
content = content.replace(/if \(dataToDisplay\.length === 0\) \{[\s\S]*?\} else \{[\s\S]*?dataToDisplay\.forEach\(\(item, index\) => \{/, renderTagihanCode);

const innerLoopCode = `
                    // Append Tagihan Table
                    if (tagihanTableBody) {
                        const tagihanRow = document.createElement('tr');
                        const tsStr = item.isDraft ? '<span class="text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded">DRAFT</span>' : formatDisplayDate(item.timestamp);
                        const kCount = Array.isArray(item.kelas) ? item.kelas.length : 0;
                        let biaya = 0;
                        if (kCount > 0) biaya = 50000 + (kCount * 50000); // 1 = 100k, 2 = 150k, 3 = 200k...
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
                    
                    const isSelected = selectedIds.has(item.id);
`;

content = content.replace(/const isSelected = selectedIds\.has\(item\.id\);/, innerLoopCode);

const afterLoopCode = `
                });
                if (document.getElementById('tagihan-total')) {
                    document.getElementById('tagihan-total').textContent = 'Rp ' + totalBTagihan.toLocaleString('id-ID');
                }
            }
`;
content = content.replace(/\s*tableBody\.appendChild\(row\);\s*\}\);/, "\n                    tableBody.appendChild(row);\n" + afterLoopCode);

fs.writeFileSync('index.html', content);
