import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }else{
      router.push('/dashboard')
    }
  }, []);
}
