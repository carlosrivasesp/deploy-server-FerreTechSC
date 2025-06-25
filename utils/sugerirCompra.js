const CompraSugerida = require('../models/compraSugerida');
const Producto = require('../models/producto');

const sugerirCompraSiEsNecesario = async (productoId) => {
  try {
    const producto = await Producto.findById(productoId);

    if (!producto) return;

    const stockActual = producto.stockActual;
    const stockMin = producto.stockMin;

    // Si el stock está por debajo o igual al mínimo
    if (stockActual <= stockMin) {
      const yaExisteSugerencia = await CompraSugerida.findOne({
        producto: productoId,
        tieneOrdenCompra: false
      });

      if (!yaExisteSugerencia) {
        await CompraSugerida.create({ producto: productoId });
        console.log(`✅ Compra sugerida generada para: ${producto.nombre}`);
      }
    } else {
      // Si el stock subió y ya hay una sugerencia sin orden, la puedes eliminar o marcar
      const sugerencia = await CompraSugerida.findOne({
        producto: productoId,
        tieneOrdenCompra: false
      });

      if (sugerencia) {
        await sugerencia.deleteOne(); // O podrías agregar un campo tipo "cancelada"
        console.log(`Sugerencia eliminada para: ${producto.nombre}`);
      }
    }
  } catch (error) {
    console.error('Error al evaluar sugerencia de compra:', error);
  }
};

module.exports = sugerirCompraSiEsNecesario;
