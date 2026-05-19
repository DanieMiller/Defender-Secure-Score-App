import { Trash2, RotateCcw } from 'lucide-react';
import type { HistoryItem, FavoriteItem } from '../types';

interface HistoryPageProps {
  items: HistoryItem[];
  onLoad: (query: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function HistoryPage({ items, onLoad, onDelete, onClear }: HistoryPageProps) {
  if (!items.length) return (
    <div className="text-center py-16 text-slate-600">
      <div className="text-5xl mb-4">🕒</div>
      <div className="text-sm">No search history yet</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">{items.length} searches</h2>
        <button
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} /> Clear all
        </button>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => onLoad(item.query)}
            className="flex items-center justify-between p-3 rounded-xl border border-blue-500/15 bg-[#0d1420] hover:border-blue-500/35 cursor-pointer transition-colors group"
          >
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">{item.query}</div>
              <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                {new Date(item.ts).toLocaleString()} · {item.confidence} confidence
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw size={13} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
              <button
                onClick={e => { e.stopPropagation(); onDelete(item.id); }}
                className="text-slate-600 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FavoritesPageProps {
  items: FavoriteItem[];
  onLoad: (query: string) => void;
  onDelete: (id: string) => void;
}

export function FavoritesPage({ items, onLoad, onDelete }: FavoritesPageProps) {
  if (!items.length) return (
    <div className="text-center py-16 text-slate-600">
      <div className="text-5xl mb-4">⭐</div>
      <div className="text-sm">No favorites yet — save a result to see it here</div>
    </div>
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-300">{items.length} saved</h2>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => onLoad(item.query)}
            className="flex items-center justify-between p-3 rounded-xl border border-blue-500/15 bg-[#0d1420] hover:border-amber-500/35 cursor-pointer transition-colors group"
          >
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">{item.query}</div>
              <div className="text-[11px] font-mono text-slate-600 mt-0.5">Saved {new Date(item.ts).toLocaleString()}</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(item.id); }}
              className="text-slate-600 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
