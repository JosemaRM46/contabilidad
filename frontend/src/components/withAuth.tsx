'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function withAuth(Component: React.FC) {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter();
    const [autenticado, setAutenticado] = useState<boolean | null>(null);

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      } else {
        setAutenticado(true);
      }
    }, []);

    // Mientras se verifica la autenticación, no mostrar nada (o un loader)
    if (autenticado === null) {
      return <div className="p-4">Verificando autenticación...</div>;
    }

    return <Component {...props} />;
  };
}
