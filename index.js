require("dotenv").config({ path: __dirname + "/.env" });
console.log(
  "JWT_SECRET:",
  process.env.JWT_SECRET ? "*** (presente)" : "FALTANTE"
); // Para verificación
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const morgan = require("morgan");

const trackingRoutes = require('./routes/trackingRoute');

// routes 
const operacion = require('./routes/operacionRoute');
const productos = require('./routes/productoRoute');
const ventas = require('./routes/ventasRoute');
const compras = require('./routes/comprasRoute');
const cotizaciones = require('./routes/cotizacionRoute');
const proveedores = require('./routes/proveedorRoute');
const clientes = require('./routes/clienteRoute');
const categorias = require('./routes/categoriaRoute');
const marcas = require('./routes/marcaRoute');
const ingresos = require('./routes/ingresoRoute');
const salidas = require('./routes/salidaRoute');
const rutasComprasSugeridas = require('./routes/compraSugeridasRoute');
const entregas = require('./routes/entregasRoute.js');
const reniecRoutes = require('./routes/servicioE.js')

// creamos servidor
const app = express();

// conectamos a la bd
connectDB();

// middlewares base
app.use(cors());
app.use(express.json());
app.use(morgan("[:date] :method :url :status - :response-time ms"));

// Usuario (auth)
app.use("/api/auth", require("./routes/usuarioRoute"));

// Carrito
app.use('/api/carrito', require('./routes/carritoRoute'));

app.use('/api/salidas', salidas);
app.use('/api/ingresos', ingresos);

app.use("/api/reniec", reniecRoutes);

// producto
app.use("/api/createProduct", productos);
app.use("/api/getProducts", productos);
app.use("/api/updateProduct", productos);
app.use("/api/getProduct", productos);
app.use("/api/deleteProduct", productos);
app.use("/api/exportarProductos", productos);
app.use("/api/obtenerProdProv", productos);

// operacion
app.use("/api/operacion", operacion);

// ventas
app.use("/api/registrarVenta", ventas);
app.use("/api/obtenerVentas", ventas);
app.use("/api/obtenerDetallesVenta", ventas);
app.use("/api/obtenerVenta", ventas);
app.use("/api/actualizarVenta", ventas);

// exportar comprobantes
app.use("/api/ventas", ventas);

// compras
app.use("/api/registrarCompra", compras);
app.use("/api/obtenerCompras", compras);
app.use("/api/obtenerDetallesCompra", compras);
app.use("/api/obtenerCompra", compras);
app.use("/api/actualizarCompra", compras);
app.use("/api/exportarCompras", compras);

// cotizaciones
app.use("/api/registrarCotizacion", cotizaciones);
app.use("/api/obtenerCotizaciones", cotizaciones);
app.use("/api/obtenerDetallesCotizacion", cotizaciones);
app.use("/api/cotizacion", cotizaciones);
app.use("/api/obtenerCotizacion", cotizaciones);
app.use("/api/actualizarCotizacion", cotizaciones);
app.use("/api/exportarCotizacion", cotizaciones);

// proveedor
app.use("/api/registerProveedor", proveedores);
app.use("/api/getProveedores", proveedores);
app.use("/api/updateProveedor", proveedores);
app.use("/api/getProveedor", proveedores);
app.use("/api/deleteProveedor", proveedores);

app.use("/api/clientes", clientes);

// categoria
app.use("/api/registerCategoria", categorias);
app.use("/api/getCategorias", categorias);
app.use("/api/updateCategoria", categorias);
app.use("/api/getCategoria", categorias);
app.use("/api/deleteCategoria", categorias);

// marca
app.use('/api/registerMarca', marcas);
app.use('/api/getMarcas', marcas);
app.use('/api/updateMarca', marcas);
app.use('/api/getMarca', marcas);
app.use('/api/deleteMarca', marcas);

// compras sugeridas
app.use("/api/comprasSugeridas", rutasComprasSugeridas);

// Entregas
app.use('/api/getEntregas', entregas);
app.use('/api/getEntrega', entregas);
app.use('/api/updateEntrega', entregas);
app.use('/api/exportarEntregas', entregas);

app.use('/api/tracking', trackingRoutes);

// arranque
app.listen(4000, () => {
  console.log("El puerto está corriendo perfectamente");
});
