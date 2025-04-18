'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';

interface Cuenta {
  codigo: string;
  nombre: string;
}

const CatalogoCuentas = () => {
  const [cuentas, setCuentas] = useState({
    Activo: [] as Cuenta[],
    Pasivo: [] as Cuenta[],
    PatrimonioNeto: [] as Cuenta[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        const response = await fetch('http://localhost:5000/catalogo_cuentas');
        
        if (!response.ok) {
          throw new Error('Error al obtener los datos');
        }

        const data = await response.json();
        setCuentas(data);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCuentas();
  }, []);

  const renderTable = (title: string, data: Cuenta[]) => (
    <div className="overflow-x-auto shadow-lg rounded-lg mb-8 w-3/12 mx-1 bg-gray-900">
      <h2 className="text-2xl font-semibold text-center text-white mb-4 bg-gray-900 py-2 rounded-t-lg">{title}</h2>
      <table className="min-w-full table-auto text-sm bg-gray-800 text-white">
        <thead className="bg-gray-900">
          <tr>
            <th className="py-3 px-4 border-b text-left">Código</th>
            <th className="py-3 px-4 border-b text-left">Nombre</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((cuenta) => (
              <tr key={cuenta.codigo} className="border-b hover:bg-gray-700">
                <td className="py-2 px-4">{cuenta.codigo}</td>
                <td className="py-2 px-4">{cuenta.nombre}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} className="py-2 px-4 text-center text-gray-400">No hay cuentas</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

  );

  return (
        <div className="min-h-screen bg-gray-100 text-white">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            {loading ? (
              <div className="text-center text-xl font-semibold text-gray-300">Cargando...</div>
            ) : (
              <div className="flex items-start justify-between">
                {renderTable('Activo', cuentas.Activo)}
                <div className="text-4xl text-gray-700 mx-4">=</div> {/* Símbolo "=" entre Activo y Pasivo */}
                {renderTable('Pasivo', cuentas.Pasivo)}
                <div className="text-4xl text-gray-700 mx-4">+</div> {/* Símbolo "+" entre Pasivo y Patrimonio Neto */}
                {renderTable('Patrimonio Neto', cuentas.PatrimonioNeto)}
              </div>
            )}
          </div>
        </div>

  );
};

export default withAuth(CatalogoCuentas);
