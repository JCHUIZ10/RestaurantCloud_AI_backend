# Dominios de negocio

Cada carpeta hija representa un límite funcional del monolito modular. Su contenido se agrega cuando se implemente el caso de uso correspondiente:

- `Auth` y `Tenancy`: autenticación, sesiones y contexto RLS.
- `Empresas`, `Locales`, `Mesas` y `Reservas`: configuración y operación del salón.
- `Pedidos`, `Cocina`, `Caja`, `Inventario` y `Compras`: núcleo transaccional operativo.
- `Suscripciones`, `Reportes`, `Notificaciones` y `Archivos`: capacidades de plataforma.
- `Shared`: contratos y elementos transversales pequeños, nunca lógica de negocio de un dominio concreto.

Un dominio puede contener `Actions`, `Data`, `Events`, `Http`, `Models`, `Policies`, `Queries` y `Services` cuando sean necesarios. Los controladores deben delegar las reglas de negocio a acciones transaccionales.
