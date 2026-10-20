# Estándar de Teléfono Móvil y Enlaces a WhatsApp (Perú)

Este documento define la regla técnica y visual única para la captura, almacenamiento y redirección a WhatsApp de números telefónicos en RestaurantCloud, previniendo bucles de formato y errores de entrada.

---

## 1. Reglas de Negocio en Perú
- **Longitud**: Todo número móvil consta exactamente de **9 dígitos numéricos**.
- **Prefijo Nacional**: Todo número móvil en Perú inicia obligatoriamente con el dígito **`9`** (ejemplo: `987654321`).
- **Código de País (E.164)**: Perú tiene el prefijo internacional **`+51`**.

---

## 2. Patrón de Interfaz de Usuario (UI) — Inmune a Bucles de Re-ingesta
Para evitar que el usuario se equivoque escribiendo `+51` o que al concatenar `+51` se re-ingrese el prefijo en cada pulsación:

1. **Badge Fijo a la Izquierda**: Se muestra un distintivo no editable con la bandera y el prefijo internacional `[ 🇵🇪 +51 ]`.
2. **Entrada Solo Numérica**: El input muestra los dígitos con formato progresivo `987 654 321`.
3. **Manejo de Estado**: Se utiliza `extraerDigitosMovilPeru` y `formatearTelefonoPeru` de `@/shared/utils`.

### Ejemplo en React / Tailwind:
```tsx
import { extraerDigitosMovilPeru, formatearTelefonoPeru } from '@/shared/utils';

<div className="flex rounded-xl border border-aurea-copper/30 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-aurea-copper">
  {/* Prefijo Fijo No Editable */}
  <div className="inline-flex items-center gap-1.5 px-3 bg-aurea-ivory border-r border-aurea-copper/20 text-aurea-navy font-semibold text-xs select-none">
    <span>🇵🇪</span>
    <span className="font-mono">+51</span>
  </div>

  {/* Input de Dígitos */}
  <input
    type="tel"
    inputMode="numeric"
    required
    maxLength={11} // "987 654 321" (9 dígitos + 2 espacios)
    value={formatearTelefonoPeru(formData.telefono)}
    onChange={(e) => {
      // 1. Extraer solo los 9 dígitos locales (remueve cualquier +51 previo)
      const digits = extraerDigitosMovilPeru(e.target.value);
      // 2. Formatear para visualización
      const formatted = formatearTelefonoPeru(digits);
      // 3. Guardar en el estado con prefijo formal para el backend
      setFormData({ ...formData, telefono: digits ? `+51 ${formatted}` : '' });
    }}
    placeholder="987 654 321"
    className="w-full px-3 py-2.5 bg-transparent text-sm font-mono focus:outline-none"
  />
</div>
```

---

## 3. Especificación de Enlaces a WhatsApp (wa.me)
La API oficial de enlaces directos de WhatsApp (**Click to Chat**) estipula:
- **Formato Requerido**: `https://wa.me/<numero_internacional>`
- **Restricción estricta**: `<numero_internacional>` **NO** debe contener el signo `+`, ni espacios, ni guiones, ni paréntesis.
- **Resultado Canónico para Perú**: `https://wa.me/51987654321` *(Código de país 51 seguido de los 9 dígitos móviles)*.

---

## 4. Helpers Reutilizables TypeScript

Ubicación: [`apps/web/src/shared/utils/whatsapp.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/shared/utils/whatsapp.ts) (re-exportados en `@/shared/utils`):

- `extraerDigitosMovilPeru(raw: string): string`: Extrae de 1 a 9 dígitos locales limpios sin importar si la cadena viene con `+51`, `51` o espacios.
- `formatearTelefonoPeru(digitsOrRaw: string): string`: Formatea progresivamente a `9`, `987`, `987 6`, `987 654 321`.
- `generarEnlaceWhatsApp(telefono: string, mensaje?: string): string`: Produce siempre la URL válida `https://wa.me/51987654321`.

### Ejemplo de Enlace a WhatsApp:
```typescript
import { generarEnlaceWhatsApp } from '@/shared/utils';

const url = generarEnlaceWhatsApp(empleado.telefono, 'Hola, bienvenido al equipo');
window.open(url, '_blank');
```
