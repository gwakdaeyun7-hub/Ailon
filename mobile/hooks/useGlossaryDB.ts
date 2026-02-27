/**
 * Glossary DB Hook - Firestore glossary_terms 컬렉션
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GlossaryTerm } from '@/lib/types';

export function useGlossaryDB(searchQuery?: string) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTerms = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'glossary_terms'), orderBy('term_en'), fbLimit(200));
      const snap = await getDocs(q);
      const all: GlossaryTerm[] = [];
      snap.forEach(d => all.push(d.data() as GlossaryTerm));
      setTerms(all);
    } catch (e) {
      console.error('useGlossaryDB error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTerms(); }, [fetchTerms]);

  const filtered = searchQuery
    ? terms.filter(t => {
        const q = searchQuery.toLowerCase();
        return (t.term_ko ?? '').toLowerCase().includes(q)
          || (t.term_en ?? '').toLowerCase().includes(q)
          || (t.desc_ko ?? '').toLowerCase().includes(q)
          || (t.desc_en ?? '').toLowerCase().includes(q);
      })
    : terms;

  return { terms: filtered, allTerms: terms, loading, refresh: fetchTerms };
}
