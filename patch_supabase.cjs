const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<script type="module">\s*import { initializeApp }.*?<\/script>/s;

const supabaseScript = `
    <!-- Supabase CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
      const supabaseUrl = 'https://tnzceffjxostkwyellwf.supabase.co';
      const supabaseKey = 'sb_publishable_b0Myq0XAqdiUj-Dzb-pHBQ_9LAmpsVE';
      const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

      const appId = typeof __app_id !== "undefined" ? __app_id : "aplikasirapor-App";
      // Supabase table target
      const collectionName = "aplikasirapor";

      const auth = {};
      const db = supabase;

      function collection(db, ...paths) {
        return collectionName; 
      }

      function doc(db, ...paths) {
        return { table: collectionName, id: paths[paths.length - 1] };
      }

      async function addDoc(colName, data) {
        const payload = { data_payload: data };
        const { data: record, error } = await supabase.from(colName).insert([payload]).select();
        if (error) {
            console.error("Supabase insert error:", error);
            throw error;
        }
        return { id: record[0].id }; 
      }

      async function updateDoc(docRef, data) {
        const { data: oldRecord, error: fetchErr } = await supabase.from(docRef.table).select('data_payload').eq('id', docRef.id).single();
        if (fetchErr) throw fetchErr;
        
        const mergedData = { ...oldRecord.data_payload, ...data };
        const { error } = await supabase.from(docRef.table).update({ data_payload: mergedData }).eq('id', docRef.id);
        if (error) throw error;
      }

      async function deleteDoc(docRef) {
        const { error } = await supabase.from(docRef.table).delete().eq('id', docRef.id);
        if (error) throw error;
      }

      function query(colName) {
        return colName;
      }

      function onSnapshot(q, callback) {
        supabase.from(q).select('*').then(({ data, error }) => {
          if (!error && data) {
            callback({
              docs: data.map(d => ({ id: d.id, data: () => d.data_payload }))
            });
          }
        });

        const channel = supabase.channel('table-db-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: q }, payload => {
            supabase.from(q).select('*').then(({ data, error }) => {
              if (!error && data) {
                callback({ docs: data.map(d => ({ id: d.id, data: () => d.data_payload })) });
              }
            });
          })
          .subscribe();

        return () => supabase.removeChannel(channel);
      }

      function serverTimestamp() {
        return Date.now();
      }

      function writeBatch(db) {
        return {
          ops: [],
          delete: function(docRef) {
            this.ops.push(docRef.id);
          },
          commit: async function() {
            if (this.ops.length > 0) {
              const { error } = await supabase.from(collectionName).delete().in('id', this.ops);
              if (error) throw error;
            }
          }
        };
      }

      async function getDocs(colName) {
         const { data, error } = await supabase.from(colName).select('*');
         if (error) throw error;
         return {
            docs: data.map(d => ({ id: d.id, data: () => d.data_payload }))
         };
      }

      function signInAnonymously(auth) { return Promise.resolve({}); }
      function signInWithCustomToken(auth, token) { return Promise.resolve({}); }
      function onAuthStateChanged(auth, cb) { cb({ uid: 'anonymous' }); }

      window.fbComponents = {
        auth, db, collection, addDoc, updateDoc, deleteDoc, doc, 
        onSnapshot, query, appId, collectionName, signInWithCustomToken, 
        signInAnonymously, onAuthStateChanged, serverTimestamp, writeBatch, getDocs
      };
    </script>
`;

if (regex.test(html)) {
  const newHtml = html.replace(regex, supabaseScript.trim());
  fs.writeFileSync('index.html', newHtml);
  console.log('Successfully replaced Firebase wrapper with Supabase wrapper.');
} else {
  console.log('Regex did not match.');
}
