const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const t2RenderOldBlockRegex = /\/\/ Render Tagihan Table[\s\S]*?if \(document\.getElementById\("tagihan-total"\)\) \{/;

let newT2Block = `// Render Tagihan Table
            let tagihanIndex = 1;
            uniqueSchools.forEach((school) => {
              if (tagihanTableBody) {
                const tagihanRow = document.createElement("tr");
                const schoolDocs = school.allTimestamps || [school];
                
                let totalSchoolBiaya = 0;
                let aggregatedKelas = new Set();
                
                schoolDocs.forEach(doc => {
                    const kCount = Array.isArray(doc.kelas) ? doc.kelas.length : 0;
                    const jp = doc["jenis-pesanan"] || "pesanan_baru";
                    if (jp === "lanjutan") {
                        totalSchoolBiaya += (kCount * 50000);
                    } else {
                        if (kCount > 0) totalSchoolBiaya += 50000 + (kCount * 50000);
                    }
                    if (Array.isArray(doc.kelas)) {
                        doc.kelas.forEach(k => aggregatedKelas.add(k));
                    }
                });
                
                const latestDoc = [...schoolDocs].sort((a,b) => (b.timestamp||0) - (a.timestamp||0))[0] || school;
                
                const tsStr = latestDoc.isDraft
                  ? '<span class="text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded">DRAFT</span>'
                  : formatDisplayDate(latestDoc.timestamp);

                totalBTagihan += totalSchoolBiaya;

                const combinedClasses = Array.from(aggregatedKelas).sort((a,b)=>a-b);

                tagihanRow.innerHTML = \`
                            <td class="px-4 py-2 text-center text-slate-400 sticky left-0 bg-white border-r border-slate-100">\${tagihanIndex++}</td>
                            <td class="px-4 py-2 text-center text-slate-500 font-mono sticky left-[50px] bg-white border-r border-slate-100">\${tsStr}</td>
                            <td class="px-4 py-2 font-bold text-slate-800 sticky left-[180px] bg-white border-r border-slate-200/80 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">\${school["nama-sekolah"] || "-"}</td>
                            <td class="px-4 py-2 text-center font-mono text-slate-500">\${school["npsn"] || "-"}</td>
                            <td class="px-4 py-2 text-center">
                                <div class="flex flex-wrap items-center justify-center gap-1">
                                    \${(combinedClasses.length > 0 ? combinedClasses : []).map((k) => \`<div class="w-4 h-4 bg-teal-100 text-teal-800 rounded font-bold text-[9px] flex items-center justify-center shadow-sm">\${k}</div>\`).join("") || '<span class="text-slate-300 italic text-xs">Belum ada</span>'}
                                </div>
                            </td>
                            <td class="px-4 py-2 text-right font-mono font-bold text-slate-700">Rp \${totalSchoolBiaya.toLocaleString("id-ID")}</td>
                        \`;
                tagihanTableBody.appendChild(tagihanRow);
              }
            });

            if (document.getElementById("tagihan-total")) {`;

content = content.replace(t2RenderOldBlockRegex, newT2Block);
fs.writeFileSync('index.html', content);
