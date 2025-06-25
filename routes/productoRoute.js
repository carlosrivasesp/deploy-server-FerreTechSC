const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// api/productos

router.post('/', productoController.createProduct)
router.get('/', productoController.getProducts)
router.get('/poco-stock', productoController.obtenerProductosConPocoStock);

router.get('/total', productoController.exportTotalProducts);
router.get('/disponibles', productoController.exportAvailableProducts);
router.get('/agotados', productoController.exportOutOfStockProducts);
router.get('/poco-stock', productoController.exportLowStockProducts);
router.get('/descontinuados', productoController.exportDiscontinuedProducts);

router.get('/proveedor/:idProveedor', productoController.obtenerProductosPorProveedor);
router.get('/proveedor/sinStock/:idProveedor', productoController.obtenerProductosPorProveedorSinStock);


router.put('/:id', productoController.updateProduct)

router.get('/:id', productoController.getProduct)
router.delete('/:id', productoController.deleteProduct)


module.exports = router;