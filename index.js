const express = require('express');
const connectDB = require('./config/db');
const cors = require("cors");

//creamos servidor
const app = express();

//conectamos a la bd
connectDB();
app.use(cors());

app.use(express.json());

//producto
app.use('/api/createProduct', require('./routes/productoRoute'));
app.use('/api/getProducts', require('./routes/productoRoute'));
app.use('/api/updateProduct', require('./routes/productoRoute'));
app.use('/api/getProduct', require('./routes/productoRoute'));
app.use('/api/deleteProduct', require('./routes/productoRoute'));
app.use('/api/exportarProductos', require('./routes/productoRoute'));

//ventas
app.use('/api/registrarVenta', require('./routes/ventasRoute'));
app.use('/api/obtenerVentas', require('./routes/ventasRoute'));
app.use('/api/obtenerDetallesVenta', require('./routes/ventasRoute'));
app.use('/api/obtenerVenta', require('./routes/ventasRoute'));
app.use('/api/actualizarVenta', require('./routes/ventasRoute'));

//compras
app.use('/api/registrarCompra', require('./routes/comprasRoute'));
app.use('/api/obtenerCompras', require('./routes/comprasRoute'));
app.use('/api/obtenerDetallesCompra', require('./routes/comprasRoute'));
app.use('/api/obtenerCompra', require('./routes/comprasRoute'));
app.use('/api/actualizarCompra', require('./routes/comprasRoute'));

//cotizaciones
app.use('/api/registrarCotizacion', require('./routes/cotizacionRoute'));
app.use('/api/obtenerCotizaciones', require('./routes/cotizacionRoute'));
app.use('/api/obtenerDetallesCotizacion', require('./routes/cotizacionRoute'));
app.use('/api/cotizacion', require('./routes/cotizacionRoute'));
app.use('/api/obtenerCotizacion', require('./routes/cotizacionRoute'));
app.use('/api/actualizarCotizacion', require('./routes/cotizacionRoute'));
app.use('/api/exportarCotizacion', require('./routes/cotizacionRoute'));

//proveedor
app.use('/api/registerProveedor', require('./routes/proveedorRoute'));
app.use('/api/getProveedores', require('./routes/proveedorRoute'));
app.use('/api/updateProveedor', require('./routes/proveedorRoute'));
app.use('/api/getProveedor', require('./routes/proveedorRoute'));
app.use('/api/deleteProveedor', require('./routes/proveedorRoute'));

// cliente
app.use('/api/registrarCliente', require('./routes/clienteRoute'));
app.use('/api/getClientes', require('./routes/clienteRoute'));
app.use('/api/updateCliente', require('./routes/clienteRoute'));
app.use('/api/getCliente', require('./routes/clienteRoute'));
app.use('/api/deleteCliente', require('./routes/clienteRoute'));
app.use('/api/exportarClientes', require('./routes/clienteRoute'));

//categoria
app.use('/api/registerCategoria', require('./routes/categoriaRoute'));
app.use('/api/getCategorias', require('./routes/categoriaRoute'));
app.use('/api/updateCategoria', require('./routes/categoriaRoute'));
app.use('/api/getCategoria', require('./routes/categoriaRoute'));
app.use('/api/deleteCategoria', require('./routes/categoriaRoute'));

//marca
app.use('/api/registerMarca', require('./routes/marcaRoute'));
app.use('/api/getMarcas', require('./routes/marcaRoute'));
app.use('/api/updateMarca', require('./routes/marcaRoute'));
app.use('/api/getMarca', require('./routes/marcaRoute'));
app.use('/api/deleteMarca', require('./routes/marcaRoute'));

//ingresoProducto
app.use('/api/getIngresos', require('./routes/ingresoProductoRoute'));
app.use('/api/getIngreso', require('./routes/ingresoProductoRoute'));

//salidaProducto
app.use('/api/getSalidas', require('./routes/salidaRoute'));
app.use('/api/getSalida', require('./routes/salidaRoute'));

//lugaresEntrega
app.use('/api/registerLugar', require('./routes/lugaresEntregaRoute'));
app.use('/api/getLugares', require('./routes/lugaresEntregaRoute'));
app.use('/api/getLugar', require('./routes/lugaresEntregaRoute'));
app.use('/api/updateLugar', require('./routes/lugaresEntregaRoute'));
app.use('/api/exportarLugares', require('./routes/lugaresEntregaRoute'));


app.listen(4000, () => {
    console.log('El puerto está corriendo perfectamente');
});