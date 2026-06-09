const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const saveProcessMatch = content.match(/async function saveProcess\(shouldClose = true\) \{[\s\S]*?showToast\("Registrasi berhasil!"\);\s*\}/);

let saveProcessCode = saveProcessMatch[0];

// Refactoring the inside of saveProcess(shouldClose = true)
const newSaveProcessCode = `async function saveProcess(shouldClose = true) {
          const id = document.getElementById("edit-id").value;
          let textUpdates = {};
          let isAnyEmpty = false;
          fieldIds.forEach((fid) => {
            const el = document.getElementById(\`edit-\${fid}\`);
            const val = el ? el.value.trim() : "";
            if (!val) isAnyEmpty = true;
            textUpdates[fid] = val;
          });

          const isLanjutan = document.getElementById("jenis-pesanan-lanjut").checked;
          const chosenJenis = isLanjutan ? "lanjutan" : "pesanan_baru";

          try {
            if (isEditMode) {
              if (window.currentEditMode === "data") {
                  if (isAnyEmpty) return showToast("Mohon isi semua kolom wajib.", false);
                  if (textUpdates["npsn"] && textUpdates["npsn"].length !== 8) {
                    document.getElementById("edit-npsn").focus();
                    return showToast("NPSN harus berisi tepat 8 digit angka.", false);
                  }
                  // Just update all documents associated with this school with new texts
                  for (const docObj of window.originalDocs) {
                      await updateDoc(
                        doc(db, "artifacts", appId, "public", "data", collectionName, docObj.id),
                        textUpdates
                      );
                  }
                  showToast("Profil sekolah berhasil diperbarui.");
              } else if (window.currentEditMode === "pesanan") {
                  // In pesanan mode, we don't care about the empty text fields or validation, 
                  // but textUpdates is populated with old values since they are hidden (not deleted).
                  // So we can still use textUpdates if building a new doc.
                  const removedParams = window.originalKelas.filter((k) => !window.currentSelectedKelas.includes(k));
                  const newlyAddedClasses = window.currentSelectedKelas.filter((k) => !window.originalKelas.includes(k));

                  for (const docObj of window.originalDocs) {
                      let tempKelas = [...(docObj.kelas || [])];
                      for (const removed of removedParams) {
                          const idx = tempKelas.indexOf(removed);
                          if (idx > -1) {
                              tempKelas.splice(idx, 1);
                          }
                      }
                      let docUpdates = { kelas: tempKelas };
                      if (newlyAddedClasses.length === 0) {
                          docUpdates["jenis-pesanan"] = chosenJenis;
                      }
                      await updateDoc(
                        doc(db, "artifacts", appId, "public", "data", collectionName, docObj.id),
                        docUpdates
                      );
                  }

                  if (newlyAddedClasses.length > 0) {
                      await addDoc(
                        collection(db, "artifacts", appId, "public", "data", collectionName),
                        {
                            ...textUpdates, // reusing old text fields
                            "jenis-pesanan": chosenJenis,
                            kelas: newlyAddedClasses,
                            timestamp: Date.now(),
                        }
                      );
                  }
                  showToast("Pesanan kelas berhasil diperbarui.");
              } else if (id.startsWith("draft-")) {
                  // Draft submission logic
                  if (isAnyEmpty) return showToast("Mohon isi semua kolom wajib.", false);
                  if (textUpdates["npsn"] && textUpdates["npsn"].length !== 8) return showToast("NPSN harus berisi tepat 8 digit angka.", false);
                  const formData = {
                    timestamp: Date.now(),
                    kelas: window.currentSelectedKelas,
                    "jenis-pesanan": chosenJenis,
                    ...textUpdates,
                  };
                  await addDoc(collection(db, "artifacts", appId, "public", "data", collectionName), formData);
                  drafts = drafts.filter((d) => d.id !== id);
                  localStorage.setItem("aplikasi-rapor-drafts", JSON.stringify(drafts));
                  showToast("Draft berhasil dikirim ke Database!");
              }
            } else {
               // New registration
               if (isAnyEmpty) return showToast("Mohon isi semua kolom wajib.", false);
               if (textUpdates["npsn"] && textUpdates["npsn"].length !== 8) return showToast("NPSN harus berisi tepat 8 digit angka.", false);
               const formData = {
                 timestamp: Date.now(),
                 kelas: window.currentSelectedKelas || [],
                 "jenis-pesanan": chosenJenis,
                 ...textUpdates,
               };
               await addDoc(collection(db, "artifacts", appId, "public", "data", collectionName), formData);
               showToast("Registrasi berhasil!");
            }`;

content = content.replace(saveProcessMatch[0], newSaveProcessCode);

fs.writeFileSync('index.html', content);
