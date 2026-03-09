import { useState, useEffect } from 'react';
import pb from '../pocketbase';

export function useAuth() {
  const [user, setUser] = useState(pb.authStore.model);

  useEffect(() => {
    const refreshAuth = async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh();
        } catch (err) {
          console.error("Auth refresh failed:", err);
          pb.authStore.clear();
        }
      }
    };
    
    refreshAuth();

    return pb.authStore.onChange((token, model) => {
      setUser(model);
    });
  }, []);

  const login = async (email, password) => {
    return pb.collection('users').authWithPassword(email, password);
  };

  const logout = () => {
    pb.authStore.clear();
  };

  return { user, login, logout, isValid: pb.authStore.isValid };
}
