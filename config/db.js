//importar libreria mongoose
const mongoose = require('mongoose');

//conectar con variable.env
require('dotenv').config({path: 'variable.env'})

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO);
        /*
        useNewUrlParser: true,
        useUnifiedTopology: true
        */
        console.log('DB conectada')
    } catch (error) {
        console.log(error);
        process.exit(1); //detenemos la app
    }
}

module.exports = connectDB