const express=require('express');
const router=express.Router();
const entregasController=require('../controllers/entregasController.js')

router.get('/listadoEntregas',entregasController.listadoGeneral);
router.get('/entregasRealizadas',entregasController.entregasRealizadas);
router.get('/entregasPendientes',entregasController.entregasPendientes);
router.get('/entregasProgramadas',entregasController.entregasProgramadas);

router.get('/',entregasController.getEntregas);
router.get('/:id',entregasController.getEntrega);
router.put('/:id',entregasController.updateEntrega);



module.exports=router;