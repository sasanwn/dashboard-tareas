import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { HttpClient } from '@angular/common/http';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  stock: number;
  precio: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})


export class App implements OnInit {

  nuevoProducto = '';
  nuevaCategoria = '';
  nuevoStock = 0;
  nuevoPrecio = 0;
  busqueda = '';
  editando = false;
  indiceEditando = -1;
  modoOscuro = false;
  graficaCategorias: any;
  graficaValorCategoria: any;
  productos: Producto[] = [];


ngOnInit() {
  const modoGuardado = localStorage.getItem('modoOscuro');

  if (modoGuardado) {
    this.modoOscuro = JSON.parse(modoGuardado);
  }

  this.cargarProductosAPI();
}


crearGrafica() {
  const categorias = this.productos.map(p => p.categoria);
  const conteo: any = {};

  categorias.forEach(cat => {
    conteo[cat] = (conteo[cat] || 0) + 1;
  });

  if (this.graficaCategorias) {
    this.graficaCategorias.destroy();
  }

  this.graficaCategorias = new Chart('graficaCategorias', {
    type: 'bar',
    data: {
      labels: Object.keys(conteo),
      datasets: [{
        label: 'Cantidad de productos',
        data: Object.values(conteo)
      }]
    }
  });
}

crearGraficaValor() {

  const valores: any = {};

  this.productos.forEach(producto => {

    if (!valores[producto.categoria]) {
      valores[producto.categoria] = 0;
    }

    valores[producto.categoria] +=
      producto.precio * producto.stock;

  });

  if (this.graficaValorCategoria) {
    this.graficaValorCategoria.destroy();
  }

  this.graficaValorCategoria = new Chart(
    'graficaValorCategoria',
    {
      type: 'pie',

      data: {
        labels: Object.keys(valores),

        datasets: [{
          data: Object.values(valores)
        }]
      }
    }
  );

}

cambiarModo() {
  this.modoOscuro = !this.modoOscuro;
  localStorage.setItem('modoOscuro', JSON.stringify(this.modoOscuro));
}

 
constructor(
  private http: HttpClient,
  private cdr: ChangeDetectorRef
) {}

  agregarProducto() {

    if (
      !this.nuevoProducto ||
      !this.nuevaCategoria ||
      this.nuevoStock < 0 ||
      this.nuevoPrecio <= 0
    ) {
      return;
    }

   const producto = {
  nombre: this.nuevoProducto,
  categoria: this.nuevaCategoria,
  stock: this.nuevoStock,
  precio: this.nuevoPrecio
};

this.http.post<any>('http://localhost:3000/productos', producto)
  .subscribe(() => {
    this.cargarProductosAPI();

    this.nuevoProducto = '';
    this.nuevaCategoria = '';
    this.nuevoStock = 0;
    this.nuevoPrecio = 0;
  });

    this.crearGrafica();
    this.crearGraficaValor();
    this.nuevoProducto = '';
    this.nuevaCategoria = '';
    this.nuevoStock = 0;
    this.nuevoPrecio = 0;
  }

obtenerValorTotal() {
  return this.productos.reduce(
    (total, producto) => total + (producto.precio * producto.stock),
    0
  );
}

obtenerStockBajo() {
  return this.productos.filter(
    producto => producto.stock <= 5
  ).length;
}


eliminarProducto(id: number) {
  const confirmar = confirm('¿Seguro que deseas eliminar este producto?');

  if (!confirmar) {
    return;
  }

  this.http.delete(`http://localhost:3000/productos/${id}`)
    .subscribe(() => {
      this.cargarProductosAPI();
    });
}

filtrarProductos() {
  if (!this.busqueda.trim()) {
    return this.productos;
  }

  return this.productos.filter(producto =>
    producto.nombre.toLowerCase()
      .includes(this.busqueda.toLowerCase())
  );
}


cargarProductosAPI() {
  this.http.get<Producto[]>('http://localhost:3000/productos')
    .subscribe((data: Producto[]) => {
      console.log('Productos desde API:', data);

      this.productos = data.map((producto: Producto) => ({
        ...producto,
        precio: Number(producto.precio),
        stock: Number(producto.stock)
      }));

      this.productos = [...this.productos];
      this.cdr.detectChanges();

      console.log('Productos guardados en Angular:', this.productos);

      setTimeout(() => {
        this.crearGrafica();
        this.crearGraficaValor();
      }, 0);
    });
}


editarProducto(index: number) {
  const producto = this.productos[index];

  this.nuevoProducto = producto.nombre;
  this.nuevaCategoria = producto.categoria;
  this.nuevoStock = producto.stock;
  this.nuevoPrecio = producto.precio;

  this.editando = true;
  this.indiceEditando = index;
}

actualizarProducto() {
  if (this.indiceEditando === -1) return;

  this.productos[this.indiceEditando] = {
  id: this.productos[this.indiceEditando].id,
  nombre: this.nuevoProducto,
  categoria: this.nuevaCategoria,
  stock: this.nuevoStock,
  precio: this.nuevoPrecio
};

  
  this.crearGrafica();
  this.crearGraficaValor();

  this.nuevoProducto = '';
  this.nuevaCategoria = '';
  this.nuevoStock = 0;
  this.nuevoPrecio = 0;
  this.editando = false;
  this.indiceEditando = -1;
}

obtenerEstado(stock: number) {
  if (stock === 0) {
    return 'Agotado';
  }

  if (stock <= 5) {
    return 'Bajo stock';
  }

  return 'Disponible';
}

exportarCSV() {
  const encabezados = 'Producto,Categoria,Stock,Precio\n';

  const filas = this.productos
    .map(producto =>
      `${producto.nombre},${producto.categoria},${producto.stock},${producto.precio}`
    )
    .join('\n');

  const csv = encabezados + filas;

  const blob = new Blob([csv], { type: 'text/csv' });

  const url = window.URL.createObjectURL(blob);

  const enlace = document.createElement('a');

  enlace.href = url;
  enlace.download = 'inventario.csv';

  enlace.click();

  window.URL.revokeObjectURL(url);
}

formatearPrecio(precio: number): string {
  return precio.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

}
