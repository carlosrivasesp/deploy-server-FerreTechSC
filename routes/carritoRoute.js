const express2 = require('express');
const router2 = express2.Router();
const auth = require('../middleware/auth');
const carritoCtrl = require('../controllers/carritoController');


router2.use(auth);


router2.get('/', carritoCtrl.getCart);
router2.post('/items', carritoCtrl.addItem);
router2.patch('/items/:productId', carritoCtrl.setQty);
router2.delete('/items/:productId', carritoCtrl.removeItem);
router2.post('/checkout', carritoCtrl.checkout);


module.exports = router2;