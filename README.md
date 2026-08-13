# GeoVS Control

Panel de administración de GeoVS: gestión de cuentas, roles, historial de
cambios y analítica de conexiones (país por IP, tiempo acumulado). Consume
la misma API que `GeoVS_game` (el servidor en `MOVIL/GeoVS/server`) — no
tiene base de datos propia.

Acceso restringido: solo cuentas con rol `admin` o `moderator` pueden
iniciar sesión aquí (una cuenta `player`/`developer` es rechazada aunque la
contraseña sea correcta).

## Correr localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:5174`. Por defecto apunta a `http://localhost:3001`
(el servidor corriendo en local); si el servidor está en otro lado, define
`VITE_SERVER_URL` en un `.env.local`.

## Cómo crear el primer administrador

No hay forma de auto-asignarse rol admin desde la UI (por seguridad). Para
la primera cuenta admin:

1. Regístrate normalmente desde `GeoVS_game` (queda como rol `player`).
2. Desde el servidor, promuévela a mano:

```bash
cd MOVIL/GeoVS/server
node --env-file=.env -e "
import('./src/db.js').then(async ({ prisma }) => {
  await prisma.user.update({ where: { username: 'tu_usuario' }, data: { role: 'admin' } });
  await prisma.\$disconnect();
});
"
```

A partir de ahí, ese admin ya puede crear/ascender otras cuentas desde el
panel.

## Permisos por rol

- **admin**: todo — crear, editar, bloquear, eliminar cuentas, y asignar
  cualquier rol.
- **moderator**: crear/editar/bloquear cuentas, pero no puede cambiar roles
  ni eliminar cuentas (eso queda reservado a admin).
