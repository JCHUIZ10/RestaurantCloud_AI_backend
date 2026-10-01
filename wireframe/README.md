# Sistema de Wireframes y Contratos UI ↔ API — RestaurantCloud AI

Este directorio contiene las especificaciones de diseño estructural, arquitectura de información, flujos de interacción, casos inesperados (estados UX) y contratos de API (Frontend ↔ Backend) de la plataforma **RestaurantCloud AI**.

---

## 1. Filosofía de Diseño: Screen-First & Contract-First

En lugar de construir endpoints de backend a ciegas o diseñar interfaces sin reglas de negocio, seguimos una metodología desacoplada:

1. **Estructural (Sin Tokens UI):** En esta etapa nos enfocamos estrictamente en layout, jerarquía de información, orden de lectura, densidad y accesibilidad. No aplicamos estilos cosméticos ni tokens finales (colores o fuentes de marca) hasta consolidar el Design System.
2. **Matriz de 5 Estados UX:** Toda pantalla debe definir su comportamiento en:
   - **Ideal:** Vista óptima con datos.
   - **Vacío (Empty):** Primera carga o colecciones en cero.
   - **Carga (Loading):** Skeletons, spinners y prevención de doble submit.
   - **Error / Validación:** Alertas semánticas y mensajes de feedback al usuario.
   - **Borde / Inesperado:** Concurrencia, límites de suscripción SaaS, desconexión de red.
3. **Contratos Inmutables:** Los payloads de Request y Response respetan el estándar del proyecto en Go ([`context/mock.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/mock.md)), encapsulados en `apiresponse.Response{Exito, Datos, Errores, Meta}`.

---

## 2. Convención de Directorios

La estructura organiza las pantallas por **Rol** y **Caso de Uso** (trazable con [`context/cu.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/cu.md)):

```text
wireframe/
├── README.md                                          # Este archivo
└── <rol>/                                             # Rol del actor
    └── <codigo_cu>-<slug-descriptivo>/                # Caso de uso específico
        ├── wireframe.md                               # Especificación de layout, estados y contratos
        └── assets/                                    # Wireframes gráficos y assets referenciales
            ├── wf_<pantalla_1>.png
            └── wf_<pantalla_2>.png
```

### Roles del Sistema:
- **`usuario`**: Casos de uso transversales a todos los actores autenticados (Login, Selección de cuenta, Perfil, etc.).
- **`saas_admin`**: Operaciones de plataforma global, gestión de tenants y catálogo de planes.
- **`propietario`**: Configuración corporativa, gestión de sedes/locales, suscripción Stripe y reportes consolidados.
- **`admin_local`**: Operación del local, configuración de salones/mesas, carta, personal y compras.
- **`mozo`**: Punto de venta móvil/tablet, mapa de mesas, comanda digital y reservas.
- **`cocina`**: Sistema KDS (Kitchen Display System), estados de preparación y control de stock rápido.
- **`cajero`**: Facturación, cobros multimoneda/tarjeta, arqueo y cierre de caja.
- **`cliente`**: Consulta de carta interactiva por QR y consulta de comprobantes públicos.

---

## 3. Plantilla Estándar para Nuevos Casos de Uso

Al agregar un nuevo wireframe en `wireframe/<rol>/<cu>/wireframe.md`, se debe seguir la siguiente estructura:

1. **Ficha Técnica:** CU trazable, Actor, Viewport (*Mobile / Tablet / Desktop*), Precondiciones y Permisos.
2. **Arquitectura de Información & Layout:** Diagramas de bloques / ASCII y enlace a las imágenes en `assets/`.
3. **Matriz de Estados UX (Casos Esperados e Inesperados):** Tabla exhaustiva de los 5 estados.
4. **Contratos de API (Frontend ↔ Backend):** Endpoints HTTP, Schemas JSON y Structs de Go.
5. **Consideraciones de Seguridad y Backend:** Tenant Isolation (RLS), Concurrencia y Eventos.
