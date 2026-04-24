import { Redirect } from 'expo-router';

export default function Index() {
  // In a real app, you would check auth state here
  // For now, we'll redirect to the login screen
  return <Redirect href="/(auth)/login" />;
}
