'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

interface Cuenta {
  id: number;
  nombre: string;
  codigo: string;
  parent_id: number | null;
  monto: number | null;
  depreciacion: number | null;
  montoSinDepreciacion: number | null;
  tipo: string | null;
  grupo: string | null;
  subgrupo: string | null;
  diferencia: number | null;
}

export default function Page() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [error, setError] = useState<string>('');
  const [codigo, setCodigo] = useState<string>('');
  const [monto, setMonto] = useState<number | null>(null);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<Cuenta | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [empresa, setEmpresa] = useState<string>('');
  const [year, setYear] = useState<string>('');

  const getCuentasConValores = async () => {
    try {
      const response = await fetch('http://localhost:5000/cuentas');
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Hubo un error al obtener las cuentas');
        setCuentas([]);
        return;
      }

      const data: Cuenta[] = await response.json();
      const cuentasFiltradas = data.filter(cuenta => 
        (cuenta.monto ?? 0) > 0 || (cuenta.montoSinDepreciacion ?? 0) > 0
      );
      
      
      if (cuentasFiltradas.length > 0) {
        setCuentas(cuentasFiltradas);
      } else {
        setError('No se encontraron cuentas con valores en monto o depreciación');
        setCuentas([]);
      }
    } catch (error) {
      setError('Hubo un error al obtener las cuentas');
      console.error(error);
    }
  };

  const handleSearchCodigo = async () => {
    try {
      const response = await fetch(`http://localhost:5000/cuentas/${codigo}`);
      if (!response.ok) {
        const message = await response.text();
        setError(message);
        setCuentaSeleccionada(null);
        return;
      }
      const cuenta: Cuenta[] = await response.json();
      setCuentaSeleccionada(cuenta[0]);
      setError('');
    } catch (error) {
      setError('Hubo un error al obtener la cuenta');
      console.error(error);
    }
  };

  const handleUpdateMonto = async () => {
    if (!cuentaSeleccionada || monto === null) {
      setError('Debe seleccionar una cuenta y asignar un monto');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/cuentas/${cuentaSeleccionada.id}/monto`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monto }),
      });

      if (response.ok) {
        setError('');
        alert('Monto actualizado correctamente');
        getCuentasConValores();
      } else {
        const message = await response.text();
        setError(message);
      }
    } catch (error) {
      setError('Hubo un error al actualizar el monto');
      console.error(error);
    }
  };

  const generateBalance = () => {
    if (!empresa || !year) {
      alert('Por favor, ingresa el nombre de la empresa y el año.');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(`${empresa}`, pageWidth / 2, 15, { align: 'center' });
    doc.text('Estado de situación financiera', pageWidth / 2, 25, { align: 'center' });
    doc.text(`al 31 de diciembre de ${year}`, pageWidth / 2, 35, { align: 'center' });

    
  
    doc.setFontSize(12);
    let yPosition = 50;
    const lineHeight = 10;
  
    const cuentasPorTipo = cuentas.reduce((acc, cuenta) => {
      if (!acc[cuenta.tipo!]) acc[cuenta.tipo!] = {};
      if (!acc[cuenta.tipo!][cuenta.grupo!]) acc[cuenta.tipo!][cuenta.grupo!] = {};
      if (!acc[cuenta.tipo!][cuenta.grupo!][cuenta.subgrupo!]) acc[cuenta.tipo!][cuenta.grupo!][cuenta.subgrupo!] = [];
      acc[cuenta.tipo!][cuenta.grupo!][cuenta.subgrupo!].push(cuenta);
      return acc;
    }, {} as Record<string, Record<string, Record<string, Cuenta[]>>>);
  
    let totalTipo = 0;
  
    for (const tipo in cuentasPorTipo) {
      doc.text(`Tipo: ${tipo}`, 14, yPosition);
      yPosition += lineHeight;
  
      let totalGrupoTipo = 0;
  
      for (const grupo in cuentasPorTipo[tipo]) {
        doc.text(`  Grupo: ${grupo}`, 20, yPosition);
        yPosition += lineHeight;
  
        let totalSubgrupoGrupo = 0;
  
        for (const subgrupo in cuentasPorTipo[tipo][grupo]) {
          doc.text(`    Subgrupo: ${subgrupo}`, 26, yPosition);
          yPosition += lineHeight;
  
          doc.text('Código', 32, yPosition);
          doc.text('Nombre', 60, yPosition);
          doc.text('Depreciables', 140, yPosition);
          doc.text('Neto', 180, yPosition);
          yPosition += lineHeight;
  
          let totalSubgrupo = 0;
  
          cuentasPorTipo[tipo][grupo][subgrupo].forEach((cuenta) => {
            const monto = Number(cuenta.monto) || 0;
            const depreciacion = Number(cuenta.depreciacion) || 0;
            const montoSinDepreciacion = Number(cuenta.montoSinDepreciacion) || 0;
  
            let montoDepreciacionMostrar = '';
            if ((montoSinDepreciacion > 0 || depreciacion > 0) && (cuenta.parent_id === 122 || cuenta.codigo === '1131' || cuenta.codigo === '11311')) {
              if (montoSinDepreciacion > 0) {
                montoDepreciacionMostrar = montoSinDepreciacion.toFixed(2);
              } else if (depreciacion > 0) {
                montoDepreciacionMostrar = depreciacion.toFixed(2);
              }
            }            
  
            if (montoSinDepreciacion > 0 || depreciacion > 0 || cuenta.parent_id === 122 || cuenta.codigo === '1131' || cuenta.codigo === '11311') {
              if (yPosition + lineHeight > 190) {
                doc.addPage();
                yPosition = 20;
              }
  
              doc.text(cuenta.codigo, 32, yPosition);
              doc.text(cuenta.nombre, 60, yPosition);
              if ((montoSinDepreciacion > 0 || depreciacion > 0) && (cuenta.parent_id === 122 || cuenta.codigo === '1131' || cuenta.codigo === '11311')) {
                doc.text(montoDepreciacionMostrar, 140, yPosition);
              }
              doc.text(monto !== 0 ? monto.toFixed(2) : '', 180, yPosition);
  
              totalSubgrupo += monto;
              yPosition += lineHeight;
            }
          });
  
          doc.text(`      Total Subgrupo: ${subgrupo}`, 32, yPosition);
          doc.text(`Total: ${totalSubgrupo.toFixed(2)}`, 210, yPosition);
          yPosition += lineHeight;
  
          totalSubgrupoGrupo += totalSubgrupo;
        }
  
        doc.text(`    Total Grupo: ${grupo}`, 20, yPosition);
        doc.text(`Total: ${totalSubgrupoGrupo.toFixed(2)}`, 250, yPosition);
        yPosition += lineHeight;
  
        totalGrupoTipo += totalSubgrupoGrupo;
      }
  
      doc.text(`  Total Tipo: ${tipo}`, 14, yPosition);
      doc.text(`Total: ${totalGrupoTipo.toFixed(2)}`, 250, yPosition);
      yPosition += lineHeight;
  
      totalTipo += totalGrupoTipo;
    }
  
    doc.save('balance_cuentas.pdf');
  };
  
  

  return (
    <div className="min-h-screen bg-blue-100 flex flex-col items-center justify-center text-black p-4">
      <h1 className="text-4xl font-bold mb-4">Generar Reporte de Cuentas</h1>

      <button
        onClick={() => {
          setShowForm(true);
          getCuentasConValores();
        }}
        className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-700 mb-4"
      >
        Generar Balance
      </button>

      {showForm && (
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-lg font-bold mb-2">Información del Reporte</h2>
          <input
            type="text"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Nombre de la empresa"
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Año"
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <button
            onClick={generateBalance}
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-700"
          >
            Generar PDF
          </button>
        </div>
      )}

      <div className="my-4">
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Ingrese código de cuenta"
          className="p-2 border border-gray-300 rounded"
        />
        <button
          onClick={handleSearchCodigo}
          className="ml-2 p-2 bg-green-500 text-white rounded hover:bg-green-700"
        >
          Buscar Cuenta
        </button>
      </div>

      {cuentaSeleccionada && (
        <div className="my-4">
          <p>Código: {cuentaSeleccionada.codigo}</p>
          <p>Nombre: {cuentaSeleccionada.nombre}</p>
          <input
            type="number"
            value={monto || ''}
            onChange={(e) => setMonto(Number(e.target.value))}
            placeholder="Ingrese monto"
            className="p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleUpdateMonto}
            className="ml-2 p-2 bg-yellow-500 text-white rounded hover:bg-yellow-700"
          >
            Actualizar Monto
          </button>
        </div>
      )}
    </div>
  );
}
