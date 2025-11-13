const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.post('/', productoController.createProduct);          
router.get('/', productoController.getProducts);
router.get('/:id', productoController.getProduct);
router.put('/:id', productoController.updateProduct);
router.delete('/:id', productoController.deleteProduct);

router.get('/stock/poco', productoController.obtenerProductosConPocoStock);
router.get('/proveedor/:idProveedor', productoController.obtenerProductosPorProveedor);
router.get('/proveedor/sinStock/:idProveedor', productoController.obtenerProductosPorProveedorSinStock);

router.get('/exportar/total', productoController.exportTotalProducts);             
router.get('/exportar/disponibles', productoController.exportAvailableProducts);    
router.get('/exportar/agotados', productoController.exportOutOfStockProducts);     
router.get('/exportar/poco-stock', productoController.exportLowStockProducts);     
router.get('/exportar/descontinuados', productoController.exportDiscontinuedProducts);

module.exports = router;
