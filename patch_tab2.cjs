const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const t2RenderStart = /dataToDisplay\.forEach\(\(item, index\) => \{[ \n\r\t]+if \(tagihanTableBody\) \{/;
const t2RenderOldBlock = /dataToDisplay\.forEach\(\(item, index\) => \{([\s\S]*?)tagihanTableBody\.appendChild\(tagihanRow\);\n                        \}\n                    \}\);\n/;

let newT2Block = `
                let tagihanIndex = 1;
                uniqueSchools.forEach((school) => {
                    const schoolItems = [...school.allTimestamps].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    schoolItems.forEach((item) => {
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
                                <td class="px-4 py-2 text-center text-slate-400 sticky left-0 bg-white border-r border-slate-100">\${tagihanIndex++}</td>
                                <td class="px-4 py-2 text-center text-slate-500 font-mono sticky left-[50px] bg-white border-r border-slate-100">\${tsStr}</td>
                                <td class="px-4 py-2 font-bold text-slate-800 sticky left-[180px] bg-white border-r border-slate-200/80 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">\${item['nama-sekolah'] || '-'} \${jenisBadge}</td>
                                <td class="px-4 py-2 text-center font-mono text-slate-500">\${item['npsn'] || '-'}</td>
                                <td class="px-4 py-2 text-center">
                                    <div class="flex flex-wrap items-center justify-center gap-1">
                                        \${(Array.isArray(item.kelas) ? item.kelas.sort() : []).map(k => \\\`<div class="w-4 h-4 bg-teal-100 text-teal-800 rounded font-bold text-[9px] flex items-center justify-center shadow-sm">\\\${k}</div>\\\`).join('') || '<span class="text-slate-300 italic text-xs">Belum ada</span>'}
                                    </div>
                                </td>
                                <td class="px-4 py-2 text-right font-mono font-bold text-slate-700">Rp \${biaya.toLocaleString('id-ID')}</td>
                            \`;
                            tagihanTableBody.appendChild(tagihanRow);
                        }
                    });
                });
`;

content = content.replace(t2RenderOldBlock, newT2Block);
fs.writeFileSync('index.html', content);
