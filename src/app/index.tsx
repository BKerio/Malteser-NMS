import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import BrandSplash from '@/components/shared/BrandSplash';

const MAIN_HOME = '/(main)/(tabs)/crew' as Href;

export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <BrandSplash />;
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={MAIN_HOME} />;
}
