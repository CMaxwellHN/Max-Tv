# MaxTV Backend — Fase 1

API para la app MaxTV (VIDAA), el panel admin y la integración con Tele Latino (Xtream Codes).
Emby se añade en la Fase 2, cuando el servidor esté corriendo.

## Instalación local

```bash
npm install
cp .env.example .env
# Edita .env con tus datos reales de Xtream Codes y la URL de tu base de datos
npm run migrate   # crea las tablas
npm run dev        # arranca el servidor con recarga automática
```

## Desplegar en Railway

1. Crea un proyecto nuevo en Railway y sube este repositorio (o conéctalo por GitHub).
2. Añade un servicio de **PostgreSQL** desde el panel de Railway — copia la `DATABASE_URL` que genera.
3. En el servicio del backend, agrega las variables de entorno de `.env.example` con tus valores reales:
   - `XTREAM_BASE_URL`, `XTREAM_USERNAME`, `XTREAM_PASSWORD` (los de tu panel de Tele Latino)
   - `JWT_SECRET` (genera uno largo y aleatorio)
   - `INITIAL_AUTHORIZED_EMAILS` (tu correo, para tener acceso admin desde el arranque)
4. Ejecuta la migración una vez desplegado: `railway run npm run migrate`
5. Railway te da una URL pública tipo `maxtv-backend.up.railway.app` — esa es la que usará
   tanto la app VIDAA como el panel admin.

## Endpoints principales

| Ruta | Descripción |
|---|---|
| `POST /api/auth/check-email` | Verifica que el correo esté autorizado |
| `POST /api/auth/select-profile` | Entra a un perfil (con PIN si tiene) y devuelve token |
| `GET /api/live/channels` | Canales en vivo desde Tele Latino |
| `GET /api/vod/movies` | Catálogo de películas |
| `GET /api/vod/series` | Catálogo de series |
| `GET /api/admin/*` | Todo lo del panel admin (requiere cuenta admin) |

## Qué falta (próximas fases)

- **Fase 2**: integración con Emby (cuando tengas el servidor corriendo — solo necesito la URL y el API key)
- **Fase 3**: la interfaz VIDAA (el diseño que ya tienes) conectada a esta API real
- **Fase 4**: el panel admin como app web para tu teléfono, con actualizaciones en tiempo real
