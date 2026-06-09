const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Patch 1: openActionModal logic to load all classes from all docs of the same NPSN
const openActionRegex = /isEditMode = true;\n\s*const item = \[\.\.\.drafts, \.\.\.allData\]\.find\(d => d\.id === id\);\n\s*if \(\!item\) return;\n\s*window\.currentSelectedKelas = Array\.isArray\(item\.kelas\) \? \[\.\.\.item\.kelas\] : \[\];/;

const newOpenAction = `isEditMode = true;
                const firstItem = [...drafts, ...allData].find(d => d.id === id);
                if (!firstItem) return;
                const npsn = firstItem.npsn ? String(firstItem.npsn).toLowerCase() : null;
                const allSchoolDocs = npsn ? [...drafts, ...allData].filter(d => !d.isDraft && d.npsn && String(d.npsn).toLowerCase() === npsn) : [firstItem];
                
                let aggregatedKelas = [];
                allSchoolDocs.forEach(d => {
                    if (Array.isArray(d.kelas)) aggregatedKelas.push(...d.kelas);
                });
                window.currentSelectedKelas = Array.from(new Set(aggregatedKelas)).sort();
                window.originalKelas = [...window.currentSelectedKelas];
                window.originalDocs = allSchoolDocs;
                const item = firstItem;`;

content = content.replace(openActionRegex, newOpenAction);

// Patch 2: saveProcess logic
// We replace the entire text of `saveProcess`
const saveProcessRegex = /async function saveProcess\(shouldClose = true\) \{[\s\S]*?refreshFilterAndRender\(\);\s*\}/;

const newSaveProcess = `async function saveProcess(shouldClose = true) {
            const id = document.getElementById('edit-id').value;
            let textUpdates = {};
            let isAnyEmpty = false;
            fieldIds.forEach(fid => { const el = document.getElementById(\`edit-\$\{fid\}\`); const val = el ? el.value.trim() : ""; if (!val) isAnyEmpty = true; textUpdates[fid] = val; });
            
            if (isAnyEmpty) return showToast("Mohon isi semua kolom wajib.", false);
            if (textUpdates['npsn'] && textUpdates['npsn'].length !== 8) { document.getElementById('edit-npsn').focus(); return showToast("NPSN harus berisi tepat 8 digit angka.", false); }

            const isLanjutan = document.getElementById('edit-jenis-pesanan-toggle').checked;
            const chosenJenis = isLanjutan ? 'lanjutan' : 'pesanan_baru';
            
            try {
                if (isEditMode) {
                    if (id.startsWith('draft-')) {
                         const formData = { timestamp: Date.now(), kelas: window.currentSelectedKelas, 'jenis-pesanan': chosenJenis, ...textUpdates };
                         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), formData);
                         drafts = drafts.filter(d => d.id !== id);
                         localStorage.setItem('aplikasi-rapor-drafts', JSON.stringify(drafts));
                         showToast("Draft berhasil dikirim ke Database!");
                    } else {
                         const removedParams = window.originalKelas.filter(k => !window.currentSelectedKelas.includes(k));
                         const newlyAddedClasses = window.currentSelectedKelas.filter(k => !window.originalKelas.includes(k));
                         
                         for (const docObj of window.originalDocs) {
                             let tempKelas = [...(docObj.kelas || [])];
                             for (const removed of removedParams) {
                                 const idx = tempKelas.indexOf(removed);
                                 if (idx > -1) {
                                     tempKelas.splice(idx, 1);
                                 }
                             }
                             await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, docObj.id), {
                                 ...textUpdates,
                                 kelas: tempKelas
                             });
                         }
                         
                         if (newlyAddedClasses.length > 0) {
                             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), {
                                 ...textUpdates,
                                 'jenis-pesanan': chosenJenis,
                                 kelas: newlyAddedClasses,
                                 timestamp: Date.now()
                             });
                         }
                         showToast("Perubahan telah disimpan. " + (newlyAddedClasses.length > 0 ? "Transaksi baru ditambahkan." : ""));
                    }
                } else {
                    const formData = { 
                         timestamp: Date.now(), 
                         kelas: window.currentSelectedKelas || [], 
                         'jenis-pesanan': chosenJenis, 
                         ...textUpdates 
                    };
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), formData);
                    showToast("Registrasi berhasil!");
                }
                
                if (shouldClose) { closeModal(); }
                else {
                    window.currentSelectedKelas = [];
                    fieldIds.forEach(fid => { const el = document.getElementById(\`edit-\$\{fid\}\`); if(el) el.value = ''; });
                    document.querySelectorAll('.kelas-btn').forEach(b => {
                        b.classList.remove('bg-teal-500', 'text-white', 'border-teal-500', 'shadow-md', 'scale-105');
                        b.classList.add('text-slate-500', 'border-slate-200');
                    });
                    document.getElementById('edit-npsn').focus();
                    window.isEditMode = false;
                    document.getElementById('jenis-pesanan-container').style.display = 'none';
                    document.getElementById('edit-jenis-pesanan-toggle').checked = false;
                }
            } catch (error) {
                console.error("Save error:", error);
                showToast("Terjadi kesalahan saat menyimpan data.", false);
            }
        }`;

content = content.replace(saveProcessRegex, newSaveProcess);

// Patch 3: Tab 1 "KELAS" HTML Header and Body td mapping
// Remove `KELAS` from table headers and body mapping in Data Pokok.
const thKelasRegex = /<th class="main-header text-center" data-sort="kelas">KELAS<\/th>\n\s*/;
content = content.replace(thKelasRegex, '');

// The render logic in Data Pokok for classes
// I need to find the exact place where I generate `<td>` for KELAS, if I did. But let's check `applySortAndRender`.
fs.writeFileSync('index.html', content);
