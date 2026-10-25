/** Enlace wa.me con mensaje de saludo para cotizar; null si el proveedor no tiene teléfono. */
export const enlaceWhatsAppProveedor = (nombre: string, tel?: string | null): string | null => {
  if (!tel) return null;
  let digitos = tel.replace(/\D/g, '');
  if (digitos.length === 9 && digitos.startsWith('9')) digitos = `51${digitos}`;
  if (!digitos) return null;
  const mensaje = `Hola ${nombre}, te escribimos de RestaurantCloud para coordinar pedidos y cotización de insumos.`;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
};
