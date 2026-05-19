import { useState, useCallback } from 'react';
import type { HistoryItem, FavoriteItem } from '../types';

const KEYS = { history: 'sso_history_v2', favorites: 'sso_favorites_v2', theme: 'sso_theme' };

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}
function write<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>(() => read(KEYS.history, []));
  const add = useCallback((query: string, confidence: string) => {
    setItems(prev => {
      const filtered = prev.filter(h => h.query !== query);
      const next = [{ id: Date.now().toString(), query, ts: new Date().toISOString(), confidence }, ...filtered].slice(0, 50);
      write(KEYS.history, next); return next;
    });
  }, []);
  const remove = useCallback((id: string) => {
    setItems(prev => { const next = prev.filter(h => h.id !== id); write(KEYS.history, next); return next; });
  }, []);
  const clear = useCallback(() => { write(KEYS.history, []); setItems([]); }, []);
  return { items, add, remove, clear };
}

export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>(() => read(KEYS.favorites, []));
  const add = useCallback((query: string) => {
    setItems(prev => {
      if (prev.find(f => f.query === query)) return prev;
      const next = [{ id: Date.now().toString(), query, ts: new Date().toISOString() }, ...prev];
      write(KEYS.favorites, next); return next;
    });
  }, []);
  const remove = useCallback((id: string) => {
    setItems(prev => { const next = prev.filter(f => f.id !== id); write(KEYS.favorites, next); return next; });
  }, []);
  const has = useCallback((query: string) => items.some(f => f.query === query), [items]);
  return { items, add, remove, has };
}

export function useTheme() {
  const [dark, setDark] = useState<boolean>(() => read(KEYS.theme, true));
  const toggle = useCallback(() => {
    setDark(prev => { write(KEYS.theme, !prev); return !prev; });
  }, []);
  return { dark, toggle };
}
