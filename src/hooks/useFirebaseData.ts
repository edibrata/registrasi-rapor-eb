import React, { useEffect, useState } from 'react';
import { 
  auth, 
  getDbCollectionPath, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  onSnapshot,
  query,
  APP_ID
} from '../lib/firebase';
import { SchoolData } from '../types';
import { User } from 'firebase/auth';

export function useFirebaseData() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          try {
            await signInWithCustomToken(auth, window.__initial_auth_token);
          } catch (err) {
            console.warn("Custom token failed, falling back to anonymous", err);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setError("Gagal terhubung ke server autentikasi.");
        setLoading(false);
      }
    };

    initializeAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Start listening to data
        const q = query(getDbCollectionPath());
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const fetchedData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || 0)
            } as SchoolData;
          });
          setData(fetchedData);
          setLoading(false);
          setError(null);
        }, (err) => {
          console.error("Snapshot error:", err);
          setError("Gagal memuat data dari cloud.");
          setLoading(false);
        });
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
        setData([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  return { user, data, loading, error };
}
