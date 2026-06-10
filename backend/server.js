const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'diazbalanzar2025.',
  database: 'inventario_db'
});

db.connect((err) => {
  if (err) {
    console.log('Error al conectar MySQL:', err);
    return;
  }

  console.log('MySQL conectado correctamente');
});

app.get('/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(result);
    }
  });
});

app.post('/productos', (req, res) => {
  const { nombre, categoria, stock, precio } = req.body;

  const sql = `
    INSERT INTO productos (nombre, categoria, stock, precio)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [nombre, categoria, stock, precio], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({
        id: result.insertId,
        nombre,
        categoria,
        stock,
        precio
      });
    }
  });
});

app.put('/productos/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, categoria, stock, precio } = req.body;

  const sql = `
    UPDATE productos
    SET nombre = ?, categoria = ?, stock = ?, precio = ?
    WHERE id = ?
  `;

  db.query(sql, [nombre, categoria, stock, precio, id], (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    res.json({ mensaje: 'Producto actualizado' });
  });
});


app.delete('/productos/:id', (req, res) => {
  const id = req.params.id;

  db.query(
    'DELETE FROM productos WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        return res.status(500).send(err);
      }

      res.json({ mensaje: 'Producto eliminado' });
    }
  );
});

app.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  const sql = 'SELECT * FROM usuarios WHERE usuario = ? AND password = ?';

  db.query(sql, [usuario, password], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }

    if (result.length > 0) {
      res.json({ acceso: true, mensaje: 'Login correcto' });
    } else {
      res.status(401).json({ acceso: false, mensaje: 'Usuario o contraseña incorrectos' });
    }
  });
});

app.listen(3000, () => {
  console.log('Servidor ejecutándose en http://localhost:3000');
});