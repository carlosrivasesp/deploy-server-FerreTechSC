const mongoose = require('mongoose');

const entregasSchema=new mongoose.Schema({
    ventaId:{type:mongoose.Schema.Types.ObjectId,ref:'Venta'},
    direccion:{
        type:String,
        default:'Pendiente'
    },
    estado:{
        type:String,
        enum:['Pendiente','En proceso','Finalizado'],
        default:'Pendiente'
    },
    fechaInicio: { type: Date, default: Date.now },
    fechaFin: { type: Date, default: Date.now },
})

const Entregas=mongoose.model('Entregas',entregasSchema);
module.exports=Entregas;