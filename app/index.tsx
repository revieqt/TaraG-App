import { Redirect } from 'expo-router';
import { useSession } from '../context/SessionContext';

export default function Index() {
  const { session, loading } = useSession();

  // Debug logging to trace authentication flow
  console.log(' Index.tsx - Loading:', loading);
  console.log(' Index.tsx - Session:', session);
  console.log(' Index.tsx - User exists:', !!session?.user);
  console.log(' Index.tsx - Access token exists:', !!session?.accessToken);

  if (loading) {
    console.log(' Index.tsx - Still loading, showing loading state');
    return null; // Show loading state while checking session
  }

  // Redirect based on authentication status
  if (session?.user && session?.accessToken) {
    console.log(' Index.tsx - User authenticated, redirecting to home');
    return <Redirect href="/(tabs)/home" />;
  }

  console.log(' Index.tsx - No valid session, redirecting to login');
  return <Redirect href="/auth/login" />;
}