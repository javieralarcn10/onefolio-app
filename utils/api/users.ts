import { User } from '@/types/custom';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const usersApi = {
  sentEmailOTP: async (body: { email: string }): Promise<{ message?: string, error?: string, details?: any }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/send-email-otp`, body, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(errorMessage || 'Failed to send email OTP');
      }
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  },
  verifyOtpCode: async (body: { email: string, code: string }): Promise<{ message?: string, error?: string, details?: any }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp-code`, body, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;

        // Throw a more descriptive error based on the error message
        if (errorMessage === "Invalid code") {
          throw new Error('Invalid verification code');
        } else if (errorMessage === "Code expired") {
          throw new Error('Verification code has expired');
        } else if (errorMessage === "Invalid request data") {
          throw new Error('Invalid request data');
        } else {
          throw new Error(errorMessage || 'Failed to verify code');
        }
      }

      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  },

  signIn: async (body: { email?: string, username?: string, password: string, platform: string }): Promise<{ user: User, error?: string }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/signin`, body, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(errorMessage || 'Failed to sign in');
      }
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  },

  signInWithoutEmail: async (body: any): Promise<{ user: User, error?: string }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/signin-without-email`, body, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(errorMessage || 'Failed to sign in');
      }
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  },

  signInWithGoogle: async (body: any): Promise<{ user: User, error?: string, details?: { googleId: string[] } }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/signin-with-google`, body, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(errorMessage || 'Failed to sign in with Google');
      }
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  },

  signInWithApple: async (body: any): Promise<{ user: User, error?: string, details?: { appleId: string[] } }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/signin-with-apple`, body, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(errorMessage || 'Failed to sign in with Apple');
      }
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  },

  updateUserInfo: async (body: any): Promise<{ user: User, error?: string }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/update-user-info`, body, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(errorMessage || 'Failed to update user info');
      }
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  },

  signOut: async (token: string) => {
    try {
      await axios.post(`${API_URL}/auth/signout`, {}, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(errorMessage || 'Failed to sign out');
      }
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  },
};