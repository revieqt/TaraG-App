import { BACKEND_URL } from '@/constants/Config';

export interface LoginResponse {
  success: boolean;
  user: any;
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface RegisterResponse {
  success: boolean;
  user: any;
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fname: string;
  lname: string;
  mname?: string;
  bdate: string;
  gender: string;
  contactNumber: string;
  username: string;
  status: string;
  type: string;
}

export interface AuthError {
  error: string;
  code?: string;
  requiresVerification?: boolean;
}

// Login user via backend API
export async function loginUserViaBackend(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error: AuthError = {
      error: data.error || 'Login failed',
      code: data.code,
      requiresVerification: data.requiresVerification,
    };
    throw error;
  }

  return data as LoginResponse;
}

// Register user via backend API
export async function registerUserViaBackend(userData: RegisterData): Promise<RegisterResponse> {
  const response = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    const error: AuthError = {
      error: data.error || 'Registration failed',
      code: data.code,
    };
    throw error;
  }

  return data as RegisterResponse;
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Token refresh failed');
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

// Logout user via backend API
export async function logoutUserViaBackend(accessToken: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Logout failed');
  }
}

// Send verification email via backend API
export async function sendVerificationEmailViaBackend(email: string, accessToken?: string): Promise<void> {
  console.log('🌐 API Service: Making request to:', `${BACKEND_URL}/auth/send-verification-email`);
  console.log('🌐 API Service: Request data:', { email, hasToken: !!accessToken });
  
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(`${BACKEND_URL}/auth/send-verification-email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
    }),
  });

  console.log('🌐 API Service: Response status:', response.status);
  
  if (!response.ok) {
    const data = await response.json();
    console.log('🌐 API Service: Error response:', data);
    throw new Error(data.error || 'Failed to send verification email');
  }
  
  console.log('🌐 API Service: Request successful');
}

// Check email verification via backend API
export async function checkEmailVerificationViaBackend(userId?: string, email?: string): Promise<{ emailVerified: boolean; tokens?: { accessToken: string; refreshToken: string } }> {
  const response = await fetch(`${BACKEND_URL}/auth/check-email-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      email,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check email verification');
  }

  return { emailVerified: data.emailVerified, tokens: data.tokens };
}

// Send password reset email via backend API
export async function sendPasswordResetViaBackend(email: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/auth/send-password-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to send password reset email');
  }
}

// Update first login status via backend API
export async function updateFirstLoginViaBackend(userIdentifier: string, interests: string[], accessToken?: string): Promise<void> {
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BACKEND_URL}/auth/update-first-login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userIdentifier,
      interests,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to update first login status');
  }
}

// Change password via backend API
export async function changePasswordViaBackend(accessToken: string, currentPassword: string, newPassword: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to change password');
  }
}
