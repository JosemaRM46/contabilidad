'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';

interface Usuario {
  nombre: string;
  correo: string;
}

const Perfil = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/auth/perfil', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setUsuario(data);
        }
        setCargando(false);
      })
      .catch(() => {
        setError('Error al obtener el perfil');
        setCargando(false);
      });
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (cargando) return <p className="p-4 text-center text-gray-600">Cargando perfil...</p>;

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-2xl shadow-lg mt-10 border border-gray-200">
        <h1 className="text-2xl font-bold mb-4 text-red-500 text-center">Error</h1>
        <p className="mb-4 text-center">{error}</p>
        <div className="flex justify-center">
          <button
            onClick={cerrarSesion}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Ir a login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="p-8 max-w-md mx-auto bg-white rounded-2xl shadow-lg mt-12 border border-gray-200">
        <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">Perfil de Usuario</h1>
        <div className="space-y-4 text-gray-700">
          <p><strong>Nombre:</strong> {usuario?.nombre}</p>
          <p><strong>Correo:</strong> {usuario?.correo}</p>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={cerrarSesion}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default withAuth(Perfil);
