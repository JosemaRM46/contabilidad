'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Cambiar "email" por "correo"
        body: JSON.stringify({ correo: email, contraseña: password }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        setError(data.message || 'Credenciales incorrectas');
        return;
      }
  
      localStorage.setItem('token', data.token); // Guarda el token
      router.push('/'); // Redirige a la página principal
    } catch (err) {
      setError('Hubo un error al iniciar sesión');
    }
  };
  

  return (
    <div><Navbar />
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Iniciar Sesión</h2>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border border-gray-300 rounded"
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border border-gray-300 rounded"
          required
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button type="submit" className="w-full bg-gray-700 text-white p-2 rounded hover:bg-gray-600">
          Iniciar Sesión
        </button>
        <div className="text-center text-sm pt-3">
          <span>¿No tienes una cuenta? </span>
          <Link href="/register" className="text-blue-500 hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </form>
    </div>
    </div>
  );
}