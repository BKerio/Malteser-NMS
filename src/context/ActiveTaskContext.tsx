import React, { createContext, useContext } from 'react';
import { useActiveTask } from '@/hooks/useActiveTask';
import { useLocationSync } from '@/hooks/useLocationSync';
import { useAuth } from '@/context/AuthContext';
import type { Task } from '@/types/api';

interface ActiveTaskContextValue {
  task: Task | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: (silent?: boolean) => Promise<void>;
}

const ActiveTaskContext = createContext<ActiveTaskContextValue | undefined>(undefined);

export function ActiveTaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const value = useActiveTask();
  useLocationSync(value.task, user);

  return <ActiveTaskContext.Provider value={value}>{children}</ActiveTaskContext.Provider>;
}

export function useActiveTaskContext() {
  const ctx = useContext(ActiveTaskContext);
  if (!ctx) throw new Error('useActiveTaskContext must be used within ActiveTaskProvider');
  return ctx;
}
