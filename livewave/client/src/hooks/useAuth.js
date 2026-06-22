import useAuthStore from '../store/authStore';
import { useEffect } from 'react';

export default function useAuth() {
  const store = useAuthStore();
  useEffect(() => { store.initAuth(); }, []);
  return store;
}
