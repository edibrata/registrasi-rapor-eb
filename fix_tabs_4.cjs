const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const tHeadRe = /<th width="100" class="main-header text-center" data-sort="npsn">NPSN<\/th>/;
content = content.replace(tHeadRe, '<th width="100" class="main-header text-center" data-sort="npsn">NPSN</th>\n            <th class="main-header text-center" data-sort="kelas">KELAS</th>');

// Update row render logic for tab 1 in index.html line 748 (approx)
// It shows: <td class="font-mono text-slate-500 text-center align-top py-2">\${highlightText(item['npsn'], searchVal)}</td>

const rowRenderRegex = /<td class="font-mono text-slate-500 text-center align-top py-2">\\\$\{highlightText\(item\['npsn'\], searchVal\)\}<\/td>/;
const rowRenderReplacement = `
                        <td class="font-mono text-slate-500 text-center align-top py-2">\${highlightText(item['npsn'], searchVal)}</td>
                        <td class="text-center align-top py-2">
                            <div class="flex flex-wrap items-center justify-center gap-1">
                                \${(Array.from(new Set(item.allKelas || [])).sort()).map(k => \`<div class="w-4 h-4 bg-teal-100 text-teal-800 rounded font-bold text-[9px] flex items-center justify-center shadow-sm">\${k}</div>\`).join('') || '<span class="text-slate-300 italic text-xs">-</span>'}
                            </div>
                        </td>
`;
content = content.replace(rowRenderRegex, rowRenderReplacement.trim());

// We also need to fix excelColumns and excel header for tab 1 since we added 'kelas' originally at the end for export, which is fine!
// But wait, "Hanya harus diatur cerdas logika eksport excelnya". The excel array already covers classes.

fs.writeFileSync('index.html', content);
