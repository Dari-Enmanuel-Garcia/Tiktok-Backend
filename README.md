# TikTok Copy Backend

Backend inspirado en TikTok, construido con Node.js y Express.
Este proyecto está en desarrollo; actualmente cuenta con funcionalidades esenciales con las cuales ya se podría construir un frontend funcional.

---

## Tecnologías principales

- Node.js
- Express
- MongoDB
- Firebase y Firebase Admin
- Nodemailer para envíos de email
- JWT para autenticación
- Bcrypt para encriptación de contraseñas
- Cloudinary para manejo de archivos multimedia
- Helmet, CORS y Express Sanitizer para seguridad
- Winston para logging
- Zod para validación de datos

---

## Rutas en la API

### Usuarios

| Método | Ruta                                  | Autenticación | Descripción                           |
|--------|---------------------------------------|---------------|-------------------------------------|
| POST   | `/api/users/createUser`                | No            | Crear un nuevo usuario               |
| POST   | `/api/users/loginUser`                 | No            | Login y obtención de token JWT       |
| POST   | `/api/users/getUserDataWithEmail`     | No            | Obtener datos de usuario por email  |
| POST   | `/api/users/followUser`                | Sí            | Seguir a otro usuario                |
| POST   | `/api/users/unFollowUser`              | Sí            | Dejar de seguir a un usuario        |
| POST   | `/api/users/verifyUser`                | Sí            | Verificar usuario con token          |
| PUT    | `/api/users/configUser`                | Sí            | Configurar datos del usuario        |
| GET    | `/api/users/getUserDataWithName/:userName` | No      | Obtener datos de usuario por nombre |
| GET    | `/api/users/searchUsers/:userName/:page`     | No      | Buscar usuarios por nombre paginados|

---

### Videos

| Método  | Ruta                                    | Autenticación | Descripción                         |
|---------|-----------------------------------------|---------------|-----------------------------------|
| POST    | `/api/videos/uploadVideo`                | Sí            | Subir un nuevo video              |
| POST    | `/api/videos/likeVideo`                  | Sí            | Dar "me gusta" a un video         |
| POST    | `/api/videos/unlikeVideo`                | Sí            | Quitar "me gusta" a un video      |
| POST    | `/api/videos/addViewToVideo`             | Sí            | Añadir vista a un video            |
| POST    | `/api/videos/updateVideoData`            | Sí            | Actualizar datos de un video       |
| POST    | `/api/videos/searchVideo`                | Sí            | Buscar videos                      |
| DELETE  | `/api/videos/deleteVideo`                | Sí            | Eliminar un video                  |
| GET     | `/api/videos/getAllVideos/:page`         | Sí            | Obtener todos los videos paginados|
| GET     | `/api/videos/getAllUserVideos/:userId/:page` | Sí         | Obtener videos de un usuario      |
| GET     | `/api/videos/getSpecificVideo/:videoId` | Sí            | Obtener datos de un video específico |
| GET     | `/api/videos/getRandomVideo`             | Sí            | Obtener video aleatorio            |


## Cómo usar

Puedes descargar o clonar el repositorio.
Luego, abre una terminal en la carpeta del proyecto y ejecuta:

npm install

Esto instalará todas las dependencias.

Finalmente, puedes iniciar el proyecto con:

node index.js


## Implementaciones pendientes

- Refactorizar el código para evitar repetición y mejorar mantenimiento.
- Agregar sistema de comentarios para los videos, permitiendo interacción entre usuarios.
- Ratelimit / mejorar Cors

