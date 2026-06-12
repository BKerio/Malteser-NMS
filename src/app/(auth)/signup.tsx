import { Redirect } from 'expo-router';

/** Responders are provisioned by admins — no self-registration. */
export default function SignupScreen() {
  return <Redirect href="/(auth)/login" />;
}
