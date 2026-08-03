import React, { createContext, useContext } from 'react';
import { useActiveTask } from '@/hooks/useActiveTask';
import { useLocationSync } from '@/hooks/useLocationSync';
import { useAuth } from '@/context/AuthContext';
import { useCrewCheckIn } from '@/context/CrewCheckInContext';
import type { Task } from '@/types/api';

interface ActiveTaskContextValue {
  task: Task | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: (silent?: boolean) => Promise<void>;
}

const ActiveTaskContext = createContext<ActiveTaskContextValue | undefined>(undefined);

function ActiveTaskInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { myVehicle } = useCrewCheckIn();
  const value = useActiveTask();
  useLocationSync(value.task, user, myVehicle);

  return <ActiveTaskContext.Provider value={value}>{children}</ActiveTaskContext.Provider>;
}

export function ActiveTaskProvider({ children }: { children: React.ReactNode }) {
  // CrewCheckInProvider wraps this in the layout so myVehicle is available.
  // Keep a fallback provider tree if layout order changes.
  return <ActiveTaskInner>{children}</ActiveTaskInner>;
}

export function useActiveTaskContext() {
  const ctx = useContext(ActiveTaskContext);
  if (!ctx) throw new Error('useActiveTaskContext must be used within ActiveTaskProvider');
  return ctx;
}
