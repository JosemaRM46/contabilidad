'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';

type Cuenta = {
  codigo: string;
  nombre: string;
  tipo: string;
  grupo: string;
  subgrupo: string;
  montoSinDepreciacion: number | null;
  monto: number;
  depreciacion: number | null;
  total?: number;
  isTotal?: boolean;
};

type Subgrupo = {
  cuentas: Cuenta[];
  total: number;
};

type Grupo = {
  subgrupos: { [key: string]: Subgrupo };
  cuentas?: Cuenta[];
  total: number;
};

type Tipo = {
  grupos: { [key: string]: Grupo };
  cuentas?: Cuenta[];
  total: number;
};

type Agrupacion = {
  [key: string]: Tipo;
};

const CatalogoCuentas = () => {
  const [cuentasAgrupadas, setCuentasAgrupadas] = useState<Agrupacion>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        const response = await fetch('http://localhost:5000/catalogo_cuentas_tipo');

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setCuentasAgrupadas(result);
      } catch (error: any) {
        console.error('Error al obtener los datos:', error);
        setError(error.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCuentas();
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-white">
      <Navbar />
      <div className="container mx-auto p-4 space-y-6">
        {Object.keys(cuentasAgrupadas).map((tipo) => (
          <div key={tipo} className="space-y-4">
            <h2 className="text-2xl font-bold text-black">{tipo}</h2>

            {Object.keys(cuentasAgrupadas[tipo].grupos).map((grupo) => (
              <div key={grupo} className="space-y-2">
                <h3 className="text-xl font-semibold text-black">{grupo}</h3>

                {Object.keys(cuentasAgrupadas[tipo].grupos[grupo].subgrupos).map((subgrupo) => (
                  <div key={subgrupo}>
                    <h4 className="text-lg font-medium text-black">{subgrupo}</h4>
                    <table className="min-w-full bg-gray-800 text-white shadow-md rounded-md">
                      <thead>
                        <tr className="bg-gray-900">
                          <th className="px-4 py-2">Código</th>
                          <th className="px-4 py-2">Nombre</th>
                          <th className="px-4 py-2">Monto Sin Depreciación</th>
                          <th className="px-4 py-2">Monto</th>
                          <th className="px-4 py-2">Total Grupos</th>
                          <th className="px-4 py-2">Total Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cuentasAgrupadas[tipo].grupos[grupo].subgrupos[subgrupo].cuentas.map((cuenta, index) => (
                          <tr
                            key={index}
                            className={cuenta.isTotal ? 'bg-gray-600 font-bold text-white' : 'bg-gray-700'}
                          >
                            <td className="border px-4 py-2">{cuenta.codigo}</td>
                            <td className="border px-4 py-2">{cuenta.nombre}</td>
                            <td className="border px-4 py-2">
                              {cuenta.montoSinDepreciacion !== null ? cuenta.montoSinDepreciacion : '-'}
                            </td>
                            <td className="border px-4 py-2">
                              {cuenta.isTotal ? cuenta.total : cuenta.monto}
                            </td>
                            <td className="border px-4 py-2"></td>
                            <td className="border px-4 py-2"></td>
                          </tr>
                        ))}

                        <tr className="bg-gray-900 font-bold">
                          <td className="border px-4 py-2">Total {subgrupo}</td>
                          <td className="border px-4 py-2"></td>
                          <td className="border px-4 py-2"></td>
                          <td className="border px-4 py-2"></td>
                          <td className="border px-4 py-2 text-right">
                            {cuentasAgrupadas[tipo].grupos[grupo].subgrupos[subgrupo].total}
                          </td>
                          <td className="border px-4 py-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}

                <table className="min-w-full bg-gray-800 text-white shadow-md rounded-md mt-2">
                  <tbody>
                    <tr className="bg-gray-700">
                      <td className="border px-4 py-2">Total del Grupo {grupo}</td>
                      <td className="border px-4 py-2"></td>
                      <td className="border px-4 py-2"></td>
                      <td className="border px-4 py-2"></td>
                      <td className="border px-4 py-2"></td>
                      <td className="border px-4 py-2 text-right">
                        {cuentasAgrupadas[tipo].grupos[grupo].total}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}

            <table className="min-w-full bg-gray-900 text-white shadow-md rounded-md mt-4">
              <tbody>
                <tr className="bg-gray-800">
                  <td className="border px-4 py-2">Total del Tipo {tipo}</td>
                  <td className="border px-4 py-2"></td>
                  <td className="border px-4 py-2"></td>
                  <td className="border px-4 py-2"></td>
                  <td className="border px-4 py-2"></td>
                  <td className="border px-4 py-2 text-right">
                    {cuentasAgrupadas[tipo].total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default withAuth(CatalogoCuentas);
