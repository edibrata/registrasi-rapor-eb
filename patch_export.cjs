const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const exportBtnBlock = /document\.getElementById\('export-excel-btn'\)\.onclick = \(\) => \{[\s\S]*?showToast\(selectedIds\.size > 0 \? "Data yang dipilih berhasil diekspor\." : "Seluruh database berhasil diekspor\."\);\s*\};\n/;

const newExportBlock = `
        document.getElementById('export-excel-btn').onclick = () => {
            const expData = [...drafts, ...allData];
            if (expData.length === 0) return showToast("Tidak ada data untuk diekspor.", false);
            let dataToExport = selectedIds.size > 0 ? expData.filter(d => selectedIds.has(d.id)) : expData;
            
            // Re-apply sorting if any
            if (sortConfig.key && sortConfig.direction) {
                dataToExport.sort((a, b) => {
                    let vA = a[sortConfig.key] || ''; let vB = b[sortConfig.key] || '';
                    if (typeof vA === 'string') vA = vA.toLowerCase(); if (typeof vB === 'string') vB = vB.toLowerCase();
                    if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (vA > vB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return (b.timestamp || 0) - (a.timestamp || 0); // fallback to timestamp
                });
            } else {
                dataToExport.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
            
            // Build groups
            const uniqueExportMap = new Map();
            dataToExport.forEach(item => {
                const key = item.npsn ? String(item.npsn).trim().toLowerCase() : (item['nama-sekolah'] ? String(item['nama-sekolah']).trim().toLowerCase() : Math.random().toString());
                if (!uniqueExportMap.has(key)) {
                    uniqueExportMap.set(key, { ...item, allTimestamps: [item], allKelas: Array.isArray(item.kelas) ? [...item.kelas] : [] });
                } else {
                    const existing = uniqueExportMap.get(key);
                    existing.allTimestamps.push(item);
                    if (Array.isArray(item.kelas)) existing.allKelas.push(...item.kelas);
                    
                    const ts1 = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
                    const ts2 = item.timestamp ? new Date(item.timestamp).getTime() : 0;
                    if (ts2 > ts1) {
                         uniqueExportMap.set(key, { ...item, allTimestamps: existing.allTimestamps, allKelas: existing.allKelas });
                    }
                }
            });
            const aggregatedExport = Array.from(uniqueExportMap.values());
            
            const tabData = document.getElementById('tab-data');
            const isDataPokokActive = tabData && tabData.classList.contains('text-teal-600');
            
            let headers = [];
            let rows = [];

            if (isDataPokokActive) {
                // Export Data Pokok (Agregat)
                headers = excelColumns.map(col => col.label);
                rows = aggregatedExport.map(item => excelColumns.map(col => { 
                    if (col.id === 'timestamp') {
                        return item.allTimestamps.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)).map(t => formatDisplayDate(t.timestamp) + (t.isDraft ? ' (DRAFT)' : '')).join("\\n");
                    }
                    if (col.id === 'kelas') {
                        const uniqueKelas = Array.from(new Set(item.allKelas)).sort();
                        return uniqueKelas.join(", ");
                    }
                    return item[col.id] || ""; 
                }));
            } else {
                // Export Tagihan
                const tagihanCols = [...excelColumns, {id: 'jenis-pesanan', label:'Jenis Pesanan'}, {id: 'biaya', label: 'Biaya (Rp)'}];
                headers = tagihanCols.map(col => col.label);

                // Flatten grouped data back out for tagihan
                aggregatedExport.forEach(school => {
                    const schoolItems = [...school.allTimestamps].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    schoolItems.forEach(item => {
                        const rowData = tagihanCols.map(col => {
                            if (col.id === 'timestamp') return formatDisplayDate(item.timestamp) + (item.isDraft ? ' (DRAFT)' : '');
                            if (col.id === 'kelas') return Array.isArray(item.kelas) ? item.kelas.join(", ") : "";
                            if (col.id === 'jenis-pesanan') {
                                const jp = item['jenis-pesanan'] || 'pesanan_baru';
                                return jp === 'lanjutan' ? 'Lanjutan (Tambahan Kelas)' : 'Pesanan Baru';
                            }
                            if (col.id === 'biaya') {
                                const kCount = Array.isArray(item.kelas) ? item.kelas.length : 0;
                                const jp = item['jenis-pesanan'] || 'pesanan_baru';
                                if (jp === 'lanjutan') return kCount * 50000;
                                return kCount > 0 ? 50000 + (kCount * 50000) : 0;
                            }
                            return item[col.id] || "";
                        });
                        rows.push(rowData);
                    });
                });
            }

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]); 
            ws['!cols'] = headers.map(h => ({ wch: 20 }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Database"); 
            XLSX.writeFile(wb, \`Ekspor Data \${isDataPokokActive ? 'Pokok' : 'Tagihan'} Aplikasi Rapor Edi Brata \${getTimestamp()}.xlsx\`); 
            showToast(selectedIds.size > 0 ? "Data yang dipilih berhasil diekspor." : "Seluruh database berhasil diekspor.");
        };
`;

content = content.replace(exportBtnBlock, newExportBlock);
fs.writeFileSync('index.html', content);
