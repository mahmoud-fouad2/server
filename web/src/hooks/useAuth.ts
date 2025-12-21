import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { User } from '@/types/dashboard';
import { LoginInput } from '@fahimo/shared/dist/auth.dto';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const { user } = await api.auth.me() as { user: User };
      setUser(user);
    } catch (error) {
      console.error('Auth check failed', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }

  async function login(data: LoginInput) {
    const response = await api.auth.login(data) as { token: string; user: User };
    localStorage.setItem('token', response.token);
    await checkUser();
    return response;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  }

  return { user, loading, login, logout, checkUser };
}
