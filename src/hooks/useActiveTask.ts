import { useCallback, useEffect, useState } from 'react';
import { getActiveTask } from '@/api/responder';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import type { Task } from '@/types/api';

export function useActiveTask() {
  const { token } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async (silent = false) => {
    if (!token) {
      setTask(null);
      setIsLoading(false);
      return;
    }

    if (!silent) setIsRefreshing(true);
    setError(null);

    try {
      const data = await getActiveTask();
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket();

    const onTaskEvent = () => fetchTask(true);

    socket.on('task:assigned', onTaskEvent);
    socket.on('task:updated', onTaskEvent);

    return () => {
      socket.off('task:assigned', onTaskEvent);
      socket.off('task:updated', onTaskEvent);
    };
  }, [token, fetchTask]);

  return { task, isLoading, isRefreshing, error, refresh: (silent = true) => fetchTask(silent) };
}
