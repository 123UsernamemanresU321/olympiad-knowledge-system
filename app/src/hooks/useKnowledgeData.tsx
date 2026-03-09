import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dataIndex } from '../lib/dataIndex';
import { isSupabaseConfigured, listKnowledgeEntities } from '../lib/supabase';

interface KnowledgeDataContextValue {
  isLoading: boolean;
  lastSyncedAt: string | null;
  refreshKnowledgeData: () => Promise<void>;
}

const KnowledgeDataContext = createContext<KnowledgeDataContextValue | null>(null);

export const KnowledgeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [, setVersion] = useState(0);

  const refreshKnowledgeData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      dataIndex.setRemoteEntries([]);
      setLastSyncedAt(null);
      setVersion((value) => value + 1);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const rows = await listKnowledgeEntities();
      dataIndex.setRemoteEntries(
        rows.map((row) => ({
          path: row.source_name
            ? `supabase:${row.source_name}#${row.id}`
            : `supabase:knowledge_entities#${row.id}`,
          data: row.payload,
        })),
      );
      setLastSyncedAt(new Date().toISOString());
      setVersion((value) => value + 1);
    } catch (error) {
      console.error('Failed to refresh remote knowledge entities.', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshKnowledgeData().catch(() => {
      // The error is already logged; keep the app usable with bundled content.
    });
  }, [refreshKnowledgeData]);

  const value = useMemo<KnowledgeDataContextValue>(() => ({
    isLoading,
    lastSyncedAt,
    refreshKnowledgeData,
  }), [isLoading, lastSyncedAt, refreshKnowledgeData]);

  return (
    <KnowledgeDataContext.Provider value={value}>
      {children}
    </KnowledgeDataContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useKnowledgeData() {
  const context = useContext(KnowledgeDataContext);
  if (!context) {
    throw new Error('useKnowledgeData must be used within KnowledgeDataProvider');
  }

  return context;
}
