const express = require('express');
const dotenv = require('dotenv');
const db = require('./services/db');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('¡Backend funcionando!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});


// Registro de usuario
app.post('/api/auth/register', (req, res) => {
  const { nombre, correo, contraseña } = req.body;

  bcrypt.hash(contraseña, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error al hashear contraseña:', err);
      return res.status(500).json({ error: 'Error al procesar la contraseña' });
    }

    const sql = 'INSERT INTO usuarios (nombre, correo, contraseña) VALUES (?, ?, ?)';

    db.query(sql, [nombre, correo, hashedPassword], (error, results) => {
      if (error) {
        console.error('Error al registrar usuario:', error);
        return res.status(500).json({ error: 'Error al registrar usuario' });
      }

      res.status(201).json({ message: 'Usuario registrado correctamente' });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { correo, contraseña } = req.body;

  console.log('Datos de inicio de sesión:', { correo, contraseña });

  const sql = 'SELECT * FROM usuarios WHERE correo = ?';
  db.query(sql, [correo], (err, results) => {
    if (err) {
      console.error('Error en la base de datos:', err);
      return res.status(500).json({ error: 'Error al iniciar sesión' });
    }

    if (results.length === 0) {
      console.log(`Usuario con correo ${correo} no encontrado`);
      return res.status(401).json({ error: 'Correo no registrado' });
    }

    const usuario = results[0];

    // Verifica si la contraseña enviada coincide con la almacenada
    console.log('Contraseña enviada:', contraseña);
    console.log('Contraseña almacenada (hash):', usuario.contraseña);

    bcrypt.compare(contraseña, usuario.contraseña, (err, esValida) => {
      if (err || !esValida) {
        console.log('Contraseña incorrecta para el usuario:', correo);
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      console.log('Login exitoso para el usuario:', correo);

      res.json({
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
        },
      });
    });
  });
});




app.get('/api/auth/perfil', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const sql = 'SELECT nombre, correo FROM usuarios WHERE id = ?';
    db.query(sql, [decoded.id], (error, results) => {
      if (error || results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(results[0]);
    });
  });
});










  app.get('/cuentas/:codigo', (req, res) => {
    const { codigo } = req.params;
  
    db.query('SELECT * FROM cuentas WHERE codigo = ?', [codigo], (err, results) => {
      if (err) {
        console.error('Error al obtener cuenta:', err);
        return res.status(500).send('Error al obtener cuenta');
      }
  
      if (results.length === 0) {
        return res.status(404).send('Cuenta no encontrada');
      }
  
      res.json(results);
    });
  });
  



  app.put('/cuentas/:id/monto', (req, res) => {
    const { id } = req.params;
    const { monto } = req.body;
  
    const codigosDepreciacion = [11311, 12221, 12231, 12241, 12251, 12261, 12271, 12281];
    const idConvertido = Number(id);
    
    db.query('SELECT codigo FROM cuentas WHERE id = ?', [idConvertido], (err, results) => {
        if (err) {
            console.error('❌ Error al obtener el código de la cuenta:', err);
            return res.status(500).send('Error al obtener los datos de la cuenta');
        }

        if (results.length === 0) {
            return res.status(404).send('Cuenta no encontrada');
        }

        const codigoCuenta = Number(results[0].codigo);
        console.log('🔍 Código de cuenta obtenido:', codigoCuenta, 'Tipo:', typeof codigoCuenta);

        const fieldToUpdate = codigosDepreciacion.includes(codigoCuenta) ? 'depreciacion' : 'montoSinDepreciacion';
  
        db.query(
            `UPDATE cuentas SET ${fieldToUpdate} = ? WHERE id = ?`,
            [monto, idConvertido],
            (err, results) => {
                if (err) {
                    console.error('❌ Error al actualizar el monto:', err);
                    return res.status(500).send('Error al actualizar el monto');
                }
  
                if (results.affectedRows === 0) {
                    return res.status(404).send('Cuenta no encontrada');
                }
  
                console.log('✅ Monto actualizado correctamente en', fieldToUpdate);
  
                db.query('CALL actualizar_monto()', (err) => {
                    if (err) {
                        console.error('❌ Error al ejecutar el procedimiento:', err);
                        return res.status(500).send('Error al actualizar montos generales');
                    }
  
                    console.log('✅ Montos generales actualizados.');
                    res.status(200).send('Monto actualizado y montos generales recalculados correctamente.');
                });
            }
        );
    });
});



  
  


  app.get('/catalogo_cuentas', (req, res) => {
    const query = `
      SELECT codigo, nombre, tipo 
      FROM cuentas 
      WHERE tipo IN ('Activo', 'Pasivo', 'Patrimonio Neto')
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al obtener el catálogo de cuentas' });
      }
  
      const data = {
        Activo: results.filter(cuenta => cuenta.tipo === 'Activo'),
        Pasivo: results.filter(cuenta => cuenta.tipo === 'Pasivo'),
        PatrimonioNeto: results.filter(cuenta => cuenta.tipo === 'Patrimonio Neto'),
      };
  
      res.status(200).json(data);
    });
  });


app.get('/cuentas', (req, res) => {
  const query = 'SELECT * FROM cuentas';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error al obtener las cuentas' });
    res.json(results);
  });
});
  
  






  
  
  
  app.get('/catalogo_cuentas_tipo', (req, res) => {
    const query = `
      SELECT 
        tipo,
        grupo,
        subgrupo,
        codigo, 
        nombre, 
        NULL AS montoSinDepreciacion, 
        monto,
        null as Totales,
        0 as isTotal
      FROM cuentas 
      WHERE (parent_id != 122 OR parent_id IS NULL)
       AND codigo NOT IN ('1131', '11311')
  
      UNION ALL
  
      SELECT 
        tipo,
        grupo,
        subgrupo,
        codigo, 
        nombre, 
        montoSinDepreciacion, 
        monto,
        null,
        0
      FROM cuentas 
      WHERE montoSinDepreciacion IS NOT NULL AND parent_id = 122
  
      UNION ALL
  
      SELECT 
        tipo,
        grupo,
        subgrupo,
        codigo, 
        nombre, 
        depreciacion, 
        monto,
        null,
        0
      FROM cuentas 
      WHERE depreciacion IS NOT NULL AND parent_id = 122

      UNION ALL

      SELECT 
        tipo,
        grupo,
        subgrupo,
        codigo,
        nombre,
        montoSinDepreciacion,
        monto,
        NULL,
        0
      FROM cuentas
      WHERE codigo = '1131'

      UNION ALL

      SELECT 
        tipo,
        grupo,
        subgrupo,
        codigo,
        nombre,
        depreciacion AS montoSinDepreciacion,
        monto,
        NULL,
        0
      FROM cuentas
      WHERE codigo = '11311'
  
      ORDER BY codigo;
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error al obtener las cuentas:', err);
        return res.status(500).json({ message: 'Error al obtener las cuentas' });
      }
  
      const groupedData = results.reduce((acc, cuenta) => {
        const { tipo, grupo, subgrupo, monto, nombre, isTotal } = cuenta;

        const montoNumeric = parseFloat(monto) || 0;

        if (!tipo) return acc;

        if (!acc[tipo]) acc[tipo] = { total: 0, grupos: {}, cuentas: [] };

        acc[tipo].cuentas.push(cuenta);

        if (grupo) {
          if (!acc[tipo].grupos[grupo]) acc[tipo].grupos[grupo] = { total: 0, subgrupos: {}, cuentas: [] };
          
          if (subgrupo) {
            if (!acc[tipo].grupos[grupo].subgrupos[subgrupo]) {
              acc[tipo].grupos[grupo].subgrupos[subgrupo] = { cuentas: [], total: 0 };
            }

            acc[tipo].grupos[grupo].subgrupos[subgrupo].cuentas.push(cuenta);

            if (!isTotal) {
              acc[tipo].grupos[grupo].subgrupos[subgrupo].total += montoNumeric;
            }
          } else {
            acc[tipo].grupos[grupo].cuentas.push(cuenta);

            if (!isTotal) {
              acc[tipo].grupos[grupo].total += montoNumeric;
            }
          }
        }

        return acc;
      }, {});

for (const tipo in groupedData) {
  const tipoData = groupedData[tipo];

  tipoData.total = tipoData.cuentas.reduce((sum, cuenta) => {
    const monto = parseFloat(cuenta.monto) || 0;
    return sum + monto;
  }, 0);

  for (const grupo in tipoData.grupos) {
    const grupoData = tipoData.grupos[grupo];

    let totalGrupo = grupoData.cuentas.reduce((sum, cuenta) => {
      const monto = parseFloat(cuenta.monto) || 0;
      return sum + monto;
    }, 0);

    for (const subgrupo in grupoData.subgrupos) {
      totalGrupo += grupoData.subgrupos[subgrupo].total;
    }

    grupoData.total = totalGrupo;
  }
}


      console.log('Datos agrupados con totales finales:', groupedData);

      res.json(groupedData);
    });
});


app.post('/api/reset_montos', (req, res) => {
  const sql = `
    UPDATE cuentas
    SET 
      monto = 0,
      montoSinDepreciacion = 0,
      depreciacion = 0
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error al reiniciar montos:', error);
      return res.status(500).json({ error: 'Error al reiniciar montos' });
    }

    res.status(200).json({ message: 'Montos reiniciados correctamente' });
  });
});






  
  
  
  
  
  
  
