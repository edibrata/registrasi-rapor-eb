const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const exportLogic = `
        document.getElementById('export-excel-btn').onclick = () => {
            const expData = [...drafts, ...allData];
            if (expData.length === 0) return showToast("Tidak ada data untuk diekspor.", false);
            const dataToExport = selectedIds.size > 0 ? expData.filter(d => selectedIds.has(d.id)) : expData;
            
            // Cerdas Export logic based on actve view (Tagihan vs Data Pokok)
            const tabData = document.getElementById('tab-data');
            const isDataPokokActive = tabData && tabData.classList.contains('text-teal-600');
            
            let headers = [];
            let rows = [];

            if (isDataPokokActive) {
                // Export Data Pokok (Agregat)
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
                // Export Tagihan (Pisah Baris Raw + Biaya)
                const tagihanCols = [...excelColumns, {id: 'jenis-pesanan', label:'Jenis Pesanan'}, {id: 'biaya', label: 'Biaya (Rp)'}];
                headers = tagihanCols.map(col => col.label);
                rows = dataToExport.map(item => tagihanCols.map(col => {
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
                }));
            }

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]); 
            // set row heights? no need, default handles \\n if text-wrap is on
            ws['!cols'] = headers.map(h => ({ wch: 20 })); // set some column width
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Database"); 
            XLSX.writeFile(wb, \`Ekspor Data \${isDataPokokActive ? 'Pokok' : 'Tagihan'} Aplikasi Rapor Edi Brata \${getTimestamp()}.xlsx\`); 
            showToast(selectedIds.size > 0 ? "Data yang dipilih berhasil diekspor." : "Seluruh database berhasil diekspor.");
        };
`;

content = content.replace(/document\.getElementById\('export-excel-btn'\)\.onclick = \(\) => \{[\s\S]*?showToast\(selectedIds\.size > 0 \? "Data yang dipilih berhasil diekspor\." : "Seluruh database berhasil diekspor\."\);\s*\};/, exportLogic);

fs.writeFileSync('index.html', content);
