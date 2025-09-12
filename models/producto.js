const mongoose = require("mongoose");

const productoSchema = mongoose.Schema({
    codInt: {
        type: String,
        required: true,
        unique: true,
    },
    nombre: {
        type: String,
        required: true,
    },
    precio: {
        type: Number,
        required: true,
    },
    stockActual: {
        type: Number,
        default: 0,
    },
    stockMin: {
        type: Number,
        default: 9,
    },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categoria",
        required: true,
    },
    marca: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Marca",
        required: true,
    },
    imageUrl: {
        type: String,
        trim: true,
        default: null,
        validate: {
            validator: function (v) {
                if (v === null || v === "") return true;
                return /^https?:\/\/.+/i.test(v);
            },
            message: "imageUrl debe ser una URL válida (http/https).",
        },
    },
    estado: {
        type: String,
        enum: ["Activo", "Descontinuado"],
    },
});

module.exports = mongoose.model("Producto", productoSchema);
