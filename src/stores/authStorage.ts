import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types/api';

const TOKEN_KEY = 'nms_token';
const USER_KEY = 'nms_user';

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function saveAuth(token: string, user: User): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
