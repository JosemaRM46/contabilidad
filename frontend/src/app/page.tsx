'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';

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

const Page = () => {
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
    const codigoValido = /^\d{4,5}$/.test(codigo) || codigo === '321';
  
    if (!codigoValido) {
      const mensaje = 'Debe ingresar un código de cuenta válido';
      alert(mensaje); // ✅ Muestra una alerta
      setError(mensaje); // ✅ Guarda mensaje para mostrarlo en la interfaz si usas un <p>{error}</p>
      setCuentaSeleccionada(null);
      return;
    }
  
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

  const generateBalanceReporte = () => {
    if (!empresa || !year) {
      alert('Por favor, ingresa el nombre de la empresa y el año.');
      return;
    }
  
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxY = 190; // margen inferior
    const lineHeight = 10;
    let yPosition = 50;
  
    // Posiciones fijas para columnas
    const colCodigo = 14;       // Columna 1: Código
    const colNombre = 45;       // Columna 2: Nombre
    const colDeprec = 140;      // Columna 3: Depreciables
    const colNeto   = 180;      // Columna 4: Neto
  
    doc.setFontSize(12);
  
    // Encabezado principal solo en la primera página
    const printTituloPrincipal = () => {
      doc.text(`${empresa}`, pageWidth / 2, 15, { align: 'center' });
      doc.text('Estado de situación financiera', pageWidth / 2, 25, { align: 'center' });
      doc.text(`al 31 de diciembre de ${year}`, pageWidth / 2, 35, { align: 'center' });
      yPosition = 50;
    };
  
    // Encabezado de columnas (todas las páginas)
    const printColumnHeaders = () => {
      if (yPosition + lineHeight > maxY) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text('Código', colCodigo, yPosition);
      doc.text('Nombre', colNombre, yPosition);
      doc.text('Depreciables', colDeprec, yPosition);
      doc.text('Neto', colNeto, yPosition);
      yPosition += lineHeight;
    };
  
    printTituloPrincipal();
  
    const cuentasPorTipo = cuentas.reduce((acc, cuenta) => {
      if (!acc[cuenta.tipo!]) acc[cuenta.tipo!] = {};
      if (!acc[cuenta.tipo!][cuenta.grupo!]) acc[cuenta.tipo!][cuenta.grupo!] = {};
      if (!acc[cuenta.tipo!][cuenta.grupo!][cuenta.subgrupo!]) acc[cuenta.tipo!][cuenta.grupo!][cuenta.subgrupo!] = [];
      acc[cuenta.tipo!][cuenta.grupo!][cuenta.subgrupo!].push(cuenta);
      return acc;
    }, {} as Record<string, Record<string, Record<string, Cuenta[]>>>);
  
    let totalTipo = 0;
  
    for (const tipo in cuentasPorTipo) {
      if (yPosition + lineHeight > maxY) {
        doc.addPage();
        yPosition = 20;
        printColumnHeaders();
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`Tipo: ${tipo}`, colCodigo, yPosition);
      yPosition += lineHeight;
      doc.setFont('helvetica', 'normal');
  
      let totalGrupoTipo = 0;
  
      for (const grupo in cuentasPorTipo[tipo]) {
        if (yPosition + lineHeight > maxY) {
          doc.addPage();
          yPosition = 20;
          printColumnHeaders();
        }
        doc.text(`  Grupo: ${grupo}`, colCodigo + 6, yPosition);
        yPosition += lineHeight;
  
        let totalSubgrupoGrupo = 0;
  
        for (const subgrupo in cuentasPorTipo[tipo][grupo]) {
          if (yPosition + lineHeight > maxY) {
            doc.addPage();
            yPosition = 20;
            printColumnHeaders();
          }
          doc.text(`    Subgrupo: ${subgrupo}`, colCodigo + 12, yPosition);
          yPosition += lineHeight;
  
          printColumnHeaders();
  
          let totalSubgrupo = 0;
  
          cuentasPorTipo[tipo][grupo][subgrupo].forEach((cuenta) => {
            const monto = Number(cuenta.monto) || 0;
            const depreciacion = Number(cuenta.depreciacion) || 0;
            const montoSinDepreciacion = Number(cuenta.montoSinDepreciacion) || 0;
  
            let montoDepreciacionMostrar = '';
            if ((montoSinDepreciacion > 0 || depreciacion > 0) &&
              (cuenta.parent_id === 122 || cuenta.codigo === '1131' || cuenta.codigo === '11311')) {
              montoDepreciacionMostrar =
                montoSinDepreciacion > 0
                  ? montoSinDepreciacion.toFixed(2)
                  : depreciacion.toFixed(2);
            }
  
            const debeMostrarse = monto !== 0 || montoDepreciacionMostrar;
  
            if (debeMostrarse) {
              if (yPosition + lineHeight > maxY) {
                doc.addPage();
                yPosition = 20;
                printColumnHeaders();
              }
  
              doc.text(cuenta.codigo, colCodigo, yPosition);
              doc.text(cuenta.nombre, colNombre, yPosition);
              if (montoDepreciacionMostrar && montoDepreciacionMostrar !== '0.00') {
                doc.text(montoDepreciacionMostrar, colDeprec, yPosition);
              }
              if (monto !== 0) {
                doc.text(monto.toFixed(2), colNeto, yPosition);
              }
  
              totalSubgrupo += monto;
              yPosition += lineHeight;
            }
          });
  
          if (yPosition + lineHeight > maxY) {
            doc.addPage();
            yPosition = 20;
            printColumnHeaders();
          }
  
          doc.text(`      Total Subgrupo: ${subgrupo}`, colCodigo, yPosition);
          doc.text(`Total: ${totalSubgrupo.toFixed(2)}`, colNeto + 30, yPosition);
          yPosition += lineHeight;
  
          totalSubgrupoGrupo += totalSubgrupo;
        }
  
        if (yPosition + lineHeight > maxY) {
          doc.addPage();
          yPosition = 20;
          printColumnHeaders();
        }
  
        doc.text(`    Total Grupo: ${grupo}`, colCodigo + 6, yPosition);
        doc.text(`Total: ${totalSubgrupoGrupo.toFixed(2)}`, colNeto + 70, yPosition);
        yPosition += lineHeight;
  
        totalGrupoTipo += totalSubgrupoGrupo;
      }
  
      if (yPosition + lineHeight > maxY) {
        doc.addPage();
        yPosition = 20;
        printColumnHeaders();
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(`  Total Tipo: ${tipo}`, colCodigo, yPosition);
      doc.text(`Total: ${totalGrupoTipo.toFixed(2)}`, colNeto + 70, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += lineHeight;
  
      totalTipo += totalGrupoTipo;
    }
  
    doc.save('balance_cuentas.pdf');
  };
  
  
  
  

  const generateBalanceCuenta = () => {
    if (!empresa || !year) {
      alert('Por favor, ingresa el nombre de la empresa y el año.');
      return;
    }
  
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
  
    const columnLeftX = 6;
    const columnRightX = pageWidth / 2 + 2;
    const lineHeight = 8;
  
    // Encabezado
    doc.setFontSize(12);
    doc.text(`${empresa}`, pageWidth / 2, 15, { align: 'center' });
    doc.text('Estado de situación financiera', pageWidth / 2, 25, { align: 'center' });
    doc.text(`al 31 de diciembre de ${year}`, pageWidth / 2, 35, { align: 'center' });
  
    doc.setFontSize(10);
  
    const cuentasPorTipo = cuentas.reduce((acc, cuenta) => {
      let tipo = cuenta.tipo!;
      if (tipo === 'Patrimonio Neto') tipo = 'Patrimonio';
  
      if (!acc[tipo]) acc[tipo] = {};
      if (!acc[tipo][cuenta.grupo!]) acc[tipo][cuenta.grupo!] = {};
      if (!acc[tipo][cuenta.grupo!][cuenta.subgrupo!]) acc[tipo][cuenta.grupo!][cuenta.subgrupo!] = [];
      acc[tipo][cuenta.grupo!][cuenta.subgrupo!].push(cuenta);
      return acc;
    }, {} as Record<string, Record<string, Record<string, Cuenta[]>>>);
  
    const buildLines = (tipo: string) => {
      const lines: (
        string | {
          codigo: string;
          nombre: string;
          depreciable: string;
          neto: string;
        }
      )[] = [];
      let totalTipo = 0;
      if (!cuentasPorTipo[tipo]) return { lines, total: totalTipo };
      lines.push(`Tipo: ${tipo}`);
      for (const grupo in cuentasPorTipo[tipo]) {
        lines.push(`  Grupo: ${grupo}`);
        for (const subgrupo in cuentasPorTipo[tipo][grupo]) {
          lines.push(`    Subgrupo: ${subgrupo}`);
          lines.push(`      Código   Nombre                                                            Depreciación                Neto`);
  
          let totalSubgrupo = 0;
          cuentasPorTipo[tipo][grupo][subgrupo].forEach((cuenta) => {
            const monto = Number(cuenta.monto) || 0;
            const depreciacion = Number(cuenta.depreciacion) || 0;
            const montoSinDepreciacion = Number(cuenta.montoSinDepreciacion) || 0;
  
            let mostrarDepreciacion = '';
            if ((montoSinDepreciacion > 0 || depreciacion > 0) &&
              (cuenta.parent_id === 122 || cuenta.codigo === '1131' || cuenta.codigo === '11311')) {
              mostrarDepreciacion = montoSinDepreciacion > 0
                ? montoSinDepreciacion.toFixed(2)
                : depreciacion.toFixed(2);
            }
  
            if (monto !== 0 || mostrarDepreciacion) {
              lines.push({
                codigo: cuenta.codigo,
                nombre: cuenta.nombre,
                depreciable: mostrarDepreciacion !== '0.00' ? mostrarDepreciacion : '',
                neto: monto !== 0 ? monto.toFixed(2) : ''
              });
              totalSubgrupo += monto;
            }
          });
  
          // Total por subgrupo
          lines.push({
            codigo: '',
            nombre: `Total Subgrupo: ${subgrupo}`,
            depreciable: '',
            neto: totalSubgrupo.toFixed(2)
          });
  
          totalTipo += totalSubgrupo;
        }
      }
  
      // Total del tipo completo (Pasivo, Patrimonio, etc.)
      lines.push({
        codigo: '',
        nombre: `Total ${tipo}`,
        depreciable: '',
        neto: totalTipo.toFixed(2)
      });
      
  
      return { lines, total: totalTipo };
    };
  
    const activo = buildLines('Activo');
    const pasivo = buildLines('Pasivo');
    const patrimonio = buildLines('Patrimonio');

    patrimonio.lines.push({
      codigo: '',
      nombre: 'Total Pasivo + Patrimonio',
      depreciable: '',
      neto: (pasivo.total + patrimonio.total).toFixed(2)
    });
  
    const pasivoPatrimonio = {
      lines: [...pasivo.lines, ...patrimonio.lines],
      total: pasivo.total + patrimonio.total
    };
  
    const maxLines = Math.max(activo.lines.length, pasivoPatrimonio.lines.length);
    let y = 50;
  
    for (let i = 0; i < maxLines; i++) {
      const leftLine = activo.lines[i];
      const rightLine = pasivoPatrimonio.lines[i];
  
      // --- Columna izquierda ---
      if (typeof leftLine === 'string') {
        if (leftLine.startsWith('Tipo:')) {
          doc.setFont('helvetica', 'bold');
          doc.text(leftLine, pageWidth / 4, y, { align: 'center' });
          doc.setFont('helvetica', 'normal');
        } else {
          doc.text(leftLine, columnLeftX, y);
        }
      } else if (typeof leftLine === 'object') {
        const isBold = leftLine.nombre?.startsWith('Total');
        if (isBold) doc.setFont('helvetica', 'bold');
  
        doc.text(leftLine.codigo, columnLeftX + 7, y);
        doc.text(leftLine.nombre, columnLeftX + 20, y);
        doc.text(leftLine.depreciable, columnLeftX + 95, y);
        doc.text(leftLine.neto, columnLeftX + 125, y);
  
        if (isBold) doc.setFont('helvetica', 'normal');
      }
  
      // --- Columna derecha ---
      if (typeof rightLine === 'string') {
        if (rightLine.startsWith('Tipo:')) {
          doc.setFont('helvetica', 'bold');
          doc.text(rightLine, (pageWidth * 3) / 4, y, { align: 'center' });
          doc.setFont('helvetica', 'normal');
        } else {
          doc.text(rightLine, columnRightX, y);
        }
      } else if (typeof rightLine === 'object') {
        const isBold = rightLine.nombre?.startsWith('Total');
        if (isBold) doc.setFont('helvetica', 'bold');
  
        doc.text(rightLine.codigo, columnRightX + 7, y);
        doc.text(rightLine.nombre, columnRightX + 20, y);
        doc.text(rightLine.depreciable, columnRightX + 90, y);
        doc.text(rightLine.neto, columnRightX + 125, y);
  
        if (isBold) doc.setFont('helvetica', 'normal');
      }
  
      y += lineHeight;
  
      if (y > 190 && i < maxLines - 1) {
        doc.addPage();
        y = 20;
      }
    }
  
    // // Imprimir totales finales globales
    // y += 10;
    // doc.setFont('helvetica', 'bold');
    // doc.text('Total Activo:', columnLeftX + 20, y);
    // doc.text(activo.total.toFixed(2), columnLeftX + 125, y);
  
    // doc.text('Total Pasivo + Patrimonio:', columnRightX + 20, y);
    // doc.text(pasivoPatrimonio.total.toFixed(2), columnRightX + 125, y);
    // doc.setFont('helvetica', 'normal');
  
    doc.save('balance_cuentas_columnas.pdf');
  };
  



  const exportToCSV = () => {
    if (cuentas.length === 0) {
      alert('No hay cuentas para exportar.');
      return;
    }
  
    const headers = ['Código', 'Nombre', 'Monto', 'Depreciación', 'Monto sin Depreciación', 'Tipo', 'Grupo', 'Subgrupo'];
    const rows = cuentas.map(cuenta => [
      cuenta.codigo,
      cuenta.nombre,
      cuenta.monto ?? '',
      cuenta.depreciacion ?? '',
      cuenta.montoSinDepreciacion ?? '',
      cuenta.tipo ?? '',
      cuenta.grupo ?? '',
      cuenta.subgrupo ?? ''
    ]);
  
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cuentas_${empresa}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetMontos = async () => {
    const confirmar = window.confirm("¿Estás seguro de que deseas hacer un nuevo balance general? Esta acción reiniciará todos los montos.");
    if (!confirmar) return;
  
    try {
      const response = await fetch("http://localhost:5000/api/reset_montos", {
        method: "POST",
      });
  
      if (response.ok) {
        alert("Balance general reiniciado exitosamente");
        getCuentasConValores(); // Recargar las cuentas actualizadas
      } else {
        const data = await response.json();
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error al reiniciar montos:", error);
      alert("Hubo un error al intentar hacer un nuevo balance");
    }
  };
  
  
  
    
  
  
  

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-black p-4 overflow-hidden">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Generar Reporte de Cuentas</h1>

        <button
          onClick={() => {
            setShowForm(true);
            getCuentasConValores();
          }}
          className="w-full p-2 bg-gray-700 text-white rounded hover:bg-gray-600 mb-4"
        >
          Generar Balance
        </button>

        {showForm && (
          <div className="bg-white p-4 rounded shadow-md">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Información del Reporte</h2>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Nombre de la empresa"
              className="w-full p-2 border border-gray-400 rounded mb-2"
            />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Año"
              className="w-full p-2 border border-gray-400 rounded mb-2"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={generateBalanceReporte}
                className="w-full p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Generar balance general en forma de reporte
              </button>
              <button
                onClick={() => generateBalanceCuenta()} // Esta función la vamos a definir abajo
                className="w-full p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Generar balance general en forma de cuenta
              </button>
              <button
                onClick={exportToCSV}
                className="w-full bg-gray-700 text-white p-2 rounded hover:bg-gray-600"
              >
                Exportar a CSV
              </button>

            </div>

          </div>
        )}

        <div className="my-4">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ingrese código de cuenta"
            className="p-2 border border-gray-400 rounded"
          />
          <button
            onClick={handleSearchCodigo}
            className="ml-2 p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Buscar Cuenta
          </button>
        </div>

        {cuentaSeleccionada && (
          <div className="my-4">
            <p className="text-gray-900">Código: {cuentaSeleccionada.codigo}</p>
            <p className="text-gray-900">Nombre: {cuentaSeleccionada.nombre}</p>
            <input
              type="number"
              value={monto || ''}
              onChange={(e) => setMonto(Number(e.target.value))}
              placeholder="Ingrese monto"
              className="p-2 border border-gray-400 rounded"
            />
            <button
              onClick={handleUpdateMonto}
              className="ml-2 p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Actualizar Monto
            </button>
          </div>
        )}
        <button
          onClick={handleResetMontos}
          className="bg-gray-900 text-white px-4 py-2 mt-6 rounded hover:bg-red-500 transition"
        >
          Hacer un nuevo balance
        </button>

      </div>
    </div>
  );
}

export default withAuth(Page);
