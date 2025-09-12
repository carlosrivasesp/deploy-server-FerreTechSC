require('dotenv').config({ path: __dirname + '/.env' });
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '*** (presente)' : 'FALTANTE'); // Para verificación
const express = require('express');
const connectDB = require('./config/db');
const cors = require("cors");

//routes
const operacion = require('./routes/operacionRoute');
const productos = require('./routes/productoRoute');
const ventas = require('./routes/ventasRoute');
const compras = require('./routes/comprasRoute');
const cotizaciones = require('./routes/cotizacionRoute');
const proveedores = require('./routes/proveedorRoute');
const clientes = require('./routes/clienteRoute');
const categorias = require('./routes/categoriaRoute');
const marcas = require('./routes/marcaRoute');
const ingresoProductos = require('./routes/ingresoProductoRoute');
const salidaProductos = require('./routes/salidaRoute');
const lugaresEntrega = require('./routes/lugaresEntregaRoute');
const rutasComprasSugeridas = require('./routes/compraSugeridasRoute');
const devolucion = require('./routes/devolucionRoute.js');
// En index.js
const morgan = require('morgan');
const entregas=require('./routes/entregasRoute.js');
const pedido=require('./routes/pedidoRoute.js');

//creamos servidor
const app = express();

//conectamos a la bd
connectDB();
app.use(cors());

app.use(express.json());

//Usuario
app.use('/api/auth', require('./routes/usuarioRoute'));



//producto
app.use('/api/createProduct', productos);
app.use('/api/getProducts', productos);
app.use('/api/updateProduct', productos);
app.use('/api/getProduct', productos);
app.use('/api/deleteProduct', productos);
app.use('/api/exportarProductos', productos);
app.use('/api/obtenerProdProv', productos);

//operacion

app.use('/api/operacion', operacion)

//ventas
app.use('/api/registrarVenta', ventas);
app.use('/api/obtenerVentas', ventas);
app.use('/api/obtenerDetallesVenta', ventas);
app.use('/api/obtenerVenta', ventas);
app.use('/api/actualizarVenta', ventas);

// exportar comprobantes
app.use('/api/ventas', ventas);

//compras
app.use('/api/registrarCompra', compras);
app.use('/api/obtenerCompras', compras);
app.use('/api/obtenerDetallesCompra', compras);
app.use('/api/obtenerCompra', compras);
app.use('/api/actualizarCompra', compras);
app.use('/api/exportarCompras', compras);


//cotizaciones
app.use('/api/registrarCotizacion', require('./routes/cotizacionRoute'));
app.use('/api/obtenerCotizaciones', require('./routes/cotizacionRoute'));
app.use('/api/obtenerDetallesCotizacion', require('./routes/cotizacionRoute'));
app.use('/api/cotizacion', require('./routes/cotizacionRoute'));
app.use('/api/obtenerCotizacion', require('./routes/cotizacionRoute'));
app.use('/api/actualizarCotizacion', require('./routes/cotizacionRoute'));
app.use('/api/exportarCotizacion', require('./routes/cotizacionRoute'));

//proveedor
app.use('/api/registerProveedor', proveedores);
app.use('/api/getProveedores', proveedores);
app.use('/api/updateProveedor', proveedores);
app.use('/api/getProveedor', proveedores);
app.use('/api/deleteProveedor', proveedores);

// cliente
app.use('/api/registrarCliente', require('./routes/clienteRoute'));
app.use('/api/getClientes', require('./routes/clienteRoute'));
app.use('/api/updateCliente', require('./routes/clienteRoute'));
app.use('/api/getCliente', require('./routes/clienteRoute'));
app.use('/api/deleteCliente', require('./routes/clienteRoute'));
app.use('/api/exportarClientes', require('./routes/clienteRoute'));

//categoria
app.use('/api/registerCategoria', categorias);
app.use('/api/getCategorias', categorias);
app.use('/api/updateCategoria', categorias);
app.use('/api/getCategoria', categorias);
app.use('/api/deleteCategoria', categorias);

//marca
app.use('/api/registerMarca', marcas);
app.use('/api/getMarcas', marcas);
app.use('/api/updateMarca', marcas);
app.use('/api/getMarca', marcas);
app.use('/api/deleteMarca', marcas);

//ingresoProducto
app.use('/api/getIngresos', ingresoProductos);
app.use('/api/getIngreso', ingresoProductos);

//devolucion
app.use('/api/getDevoluciones', devolucion);
app.use('/api/getDevolucion', devolucion);

//salidaProducto
app.use('/api/getSalidas', salidaProductos);
app.use('/api/getSalida', salidaProductos);

//lugaresEntrega
app.use('/api/registerLugar', lugaresEntrega);
app.use('/api/getLugares', lugaresEntrega);
app.use('/api/getLugar', lugaresEntrega);
app.use('/api/updateLugar', lugaresEntrega);
app.use('/api/exportarLugares', lugaresEntrega);

//compras sugeridas
app.use('/api/comprasSugeridas', rutasComprasSugeridas);
// Después de crear la app
app.use(morgan('[:date] :method :url :status - :response-time ms'));
//Entregas
app.use('/api/getEntregas',entregas);
app.use('/api/getEntrega',entregas);
app.use('/api/updateEntrega',entregas);
app.use('/api/exportarEntregas',entregas);

//Pedido
app.use('/api/registrarPedido',require('./routes/pedidoRoute.js'));
app.use('/api/getPedidos',require('./routes/pedidoRoute.js'));

app.listen(4000, ()=> {
    console.log('El puerto está corriendo perfectamente');
});