'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RegistroUsuario {
  nombre: string;
  correo: string;
  contraseña: string;
}

const RegistroPage = () => {
  const [formData, setFormData] = useState<RegistroUsuario>({
    nombre: '',
    correo: '',
    contraseña: '',
  });

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    // Validación básica
    if (!formData.nombre || !formData.correo || !formData.contraseña) {
      setError('Por favor, complete todos los campos');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje('Usuario registrado correctamente');
        setFormData({ nombre: '', correo: '', contraseña: '' });
        router.push('/login'); // Redirige a login después de registro exitoso
      } else {
        setError(data.error || 'Error al registrar usuario');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Registro de Usuario</h2>

          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full mb-3 p-2 border border-gray-300 rounded"
            required
          />

          <input
            type="email"
            name="correo"
            placeholder="Correo electrónico"
            value={formData.correo}
            onChange={handleChange}
            className="w-full mb-3 p-2 border border-gray-300 rounded"
            required
          />

          <input
            type="password"
            name="contraseña"
            placeholder="Contraseña"
            value={formData.contraseña}
            onChange={handleChange}
            className="w-full mb-3 p-2 border border-gray-300 rounded"
            required
          />

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {mensaje && <p className="text-green-500 text-sm mb-3">{mensaje}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-700 text-white p-2 rounded hover:bg-gray-600 mb-2"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>

          <div className="text-center text-sm">
            <span>¿Ya tienes una cuenta? </span>
            <Link href="/login" className="text-blue-500 hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistroPage;