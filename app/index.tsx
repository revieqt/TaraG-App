import { Redirect } from 'expo-router';
import { useSession } from '../context/SessionContext';

export default function Index() {
  const { session, loading } = useSession();

  if (loading) {
    return null; // Show loading state while checking session
  }

  // Redirect based on authentication status
  if (session?.user && session?.accessToken) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/login" />;
}