# API Voll.med

API REST para la aplicación **Voll.med**, una solución para gestionar la administración de médicos, pacientes y consultas en una clínica. Incluye funcionalidades de CRUD para médicos y pacientes, así como programación y cancelación de consultas. Además, cuenta con autenticación basada en JWT y documentación en Swagger.

## Descripción

La API Voll.med permite:
- **Gestión de médicos y pacientes**: Registro, actualización, consulta y eliminación.
- **Administración de consultas**: Programación y cancelación de citas con médicos.
- **Autenticación**: Rutas seguras con tokens JWT.

## Endpoints Principales

### Pacientes

| Método | Endpoint            | Descripción                          |
|--------|----------------------|--------------------------------------|
| POST   | `/pacientes`        | Registrar un nuevo paciente          |
| GET    | `/pacientes`        | Listar pacientes con paginación      |
| GET    | `/pacientes/{id}`   | Obtener detalles de un paciente      |
| PUT    | `/pacientes`        | Actualizar los datos de un paciente  |
| DELETE | `/pacientes/{id}`   | Eliminar un paciente                 |

### Médicos

| Método | Endpoint             | Descripción                           |
|--------|-----------------------|---------------------------------------|
| POST   | `/medicos`           | Registrar un nuevo médico             |
| GET    | `/medicos`           | Listar médicos con paginación         |
| GET    | `/medicos/{id}`      | Obtener detalles de un médico         |
| PUT    | `/medicos`           | Actualizar datos de un médico         |
| DELETE | `/medicos/{id}`      | Desactivar un médico                  |

### Consultas

| Método | Endpoint             | Descripción                           |
|--------|-----------------------|---------------------------------------|
| POST   | `/consultas`         | Programar una nueva consulta          |
| DELETE | `/consultas`         | Cancelar una consulta                 |
| PUT    | `/consultas`         | Actualizar los datos de una consulta  |

# 🛡️ Seguridad & Autenticación

La aplicación implementa un sistema de autenticación robusto basado en **JWT + Refresh Tokens rotativos**, siguiendo las prácticas modernas empleadas por **Auth0, Okta y AWS Cognito**.

A continuación se describe el flujo completo de seguridad, los endpoints involucrados y las decisiones de diseño adoptadas.

---

## 🔐 1. Autenticación con JWT (Access Token)

El **Access Token** es un JWT firmado con **HMAC256**, el cual funciona como la credencial de corto plazo para acceder a los recursos protegidos.

### Contenido del Token (Payload)
* **sub**: Email del usuario.
* **id**: Identificador único en la base de datos.
* **roles**: Listado de permisos (ej. `ROLE_ADMIN`).
* **iat**: Fecha de emisión (*issued at*).
* **exp**: Fecha de expiración (configurado a **15 minutos**).

### Flujo de obtención
Se genera exclusivamente al iniciar sesión de forma exitosa.

**Endpoint:** `POST /auth/login`

**Respuesta de ejemplo:**
```json
{
  "access_token": "<jwt_string>",
  "refresh_token": "<uuid_string>",
  "expires_in": 900,
  "token_type": "Bearer"
} 
```

## 🔁 2. Refresh Tokens Rotativos (7 días)

Además del access token, el backend genera un **Refresh Token** para permitir que la sesión se mantenga activa de forma segura por periodos más largos.

### Características principales:
* **Validez:** Tiene 7 días de vida útil.
* **Formato:** Es un UUID único y aleatorio (opaco).
* **Persistencia:** Se almacena en la base de datos para control administrativo.
* **Política de Revocación:** No se eliminan físicamente; se marcan como `revoked` para mantener un historial de auditoría.
* **Rotación Obligatoria:** Cada vez que se usa un refresh token para obtener un nuevo acceso, el token anterior queda invalidado y se emite uno completamente nuevo. Esto mitiga ataques de *Token Replay*.

### Estructura de la tabla en base de datos:

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | PK (Long/UUID) | Identificador de la entrada. |
| `usuario_id` | FK | Relación con el usuario propietario. |
| `token` | UUID (Único) | El valor del token que viaja en la petición. |
| `expiracion` | DateTime | Fecha y hora límite de validez. |
| `revoked` | Boolean | Estado del token (true = invalidado). |

---
## 🔄 3. Endpoint de Refresh Token

Este endpoint es crítico para la experiencia de usuario, ya que permite obtener un nuevo **Access Token** de forma transparente sin que el usuario tenga que volver a introducir sus credenciales (email y contraseña).

**Endpoint:** `POST /auth/refresh`  
**Header:** `Content-Type: application/json`

### Cuerpo de la petición (Request):
```json
{
  "refreshToken": "<token_uuid_actual>"
}
```

### Respuesta del servidor (Response):

```json
{
  "accessToken": "<nuevo_access_token_jwt>",
  "refreshToken": "<nuevo_refresh_token_uuid>"
}
```

### Lógica interna de seguridad:

* **✔ Validación:** El servidor comprueba que el token exista en la base de datos, pertenezca al usuario, no haya expirado y no esté marcado como `revoked`.
* **✔ Revocación:** El token utilizado se marca inmediatamente como `revoked = true`.
* **✔ Generación:** Se crea un nuevo par de tokens (Rotación) para asegurar que, si un token fuera interceptado, el atacante no pueda usarlo indefinidamente.

---
### Lógica interna de seguridad:

* **✔ Validación:** El servidor comprueba que el token exista en la base de datos, pertenezca al usuario, no haya expirado y no esté marcado como `revoked`.
* **✔ Revocación:** El token utilizado se marca inmediatamente como `revoked = true`.
* **✔ Generación:** Se crea un nuevo par de tokens (Rotación) para asegurar que, si un token fuera interceptado, el atacante no pueda usarlo indefinidamente.

---
### Comportamiento:

* **✔ Revocación:** Marca el token como `revoked = true`.
* **✔ Persistencia:** No se elimina de la base → queda registro para auditoría.
* **✔ Seguridad:** Evita que el token pueda ser usado nuevamente en `/auth/refresh`.
* **✔ Acceso:** No requiere access token (igual que en sistemas como Auth0).

---
## ✉️ 5. Recuperación de Contraseña vía Email

El sistema incluye un proceso seguro de recuperación de clave basado en tokens de un solo uso para garantizar la identidad del usuario.

### ➤ Paso 1: Solicitar reset de contraseña
El usuario ingresa su correo y el sistema genera un vínculo temporal.

**Endpoint:** `POST /auth/forgot-password`
```json
{
  "email": "usuario@example.com"
}
```

* Se genera un token de un solo uso.
* Se envía por email un enlace con token.

### ➤ Paso 2: Confirmar cambio de contraseña
El usuario utiliza el token recibido para establecer su nueva clave.

**Endpoint:** `POST /auth/reset-password`

```json
{
  "token": "<token_recibido>",
  "nuevaClave": "xxxxxxxx"
}
```

### Reglas de seguridad aplicadas:

* **✔ Token con expiración**
* **✔ Eliminación tras uso**
* **✔ Notificación por email al usuario**

---
## ✉️ 6. Cambio de Email con Confirmación

El usuario puede actualizar su dirección de correo electrónico, asegurando la validez de la nueva cuenta mediante un flujo de doble verificación.

### Proceso de seguridad:
1. Se genera un token temporal de alta entropía.
2. Se envía un email con un enlace de confirmación a la nueva dirección.
3. Solo al confirmar el token, se procede a actualizar la dirección en la base de datos.

### Endpoints involucrados:

**Solicitud de cambio:**
`POST /usuario/cambio-email`

**Confirmación definitiva:**
`POST /usuario/confirmar-cambio-email`

---
## 🔑 7. Seguridad con Roles

El sistema implementa autorización basada en roles (RBAC) inyectados directamente dentro del payload del JWT. Esto permite al backend y al frontend validar permisos sin consultas adicionales a la base de datos en cada petición.

### Roles definidos:
* **ROLE_ADMIN**: Acceso total a la administración y configuración.
* **ROLE_MEDICO**: Gestión de historiales clínicos y consultas.
* **ROLE_RECEPCIONISTA**: Gestión de agendas, citas y pacientes.
* **ROLE_USUARIO**: Acceso básico al perfil de usuario final.

### Implementación técnica:
Se utiliza la seguridad de Spring para interceptar las rutas:

```java
.requestMatchers("/admin/**").hasRole("ADMIN")
```

### Se personaliza el acceso por cada recurso específico:

* **Médicos:** Consultas y diagnósticos.
* **Pacientes:** Datos personales y citas.
* **Consultas:** Registro y seguimiento.
* **Gestión de usuarios:** Altas, bajas y modificaciones.

---
## 🧱 8. Filtro de Seguridad personalizado

El sistema utiliza un filtro de seguridad basado en la clase `OncePerRequestFilter`, encargado de validar cada petición entrante antes de que llegue a los controladores.

### Funcionamiento del filtro:
* **✔ Extracción:** Lee el Access Token directamente desde el header `Authorization` usando el esquema *Bearer*.
* **✔ Validación:** Obtiene el email (subject) y los roles del usuario desde el JWT validando la firma.
* **✔ Autenticación:** Autentica al usuario en el contexto de seguridad de Spring Security para esa petición específica.
* **✔ Exclusiones:** El filtro ignora automáticamente los endpoints públicos (login, refresh, reset password, logout).

> [!TIP]
> **Arquitectura Stateless:** El sistema es totalmente stateless; no se utilizan sesiones de servidor (`HttpSession`) ni cookies para almacenar el estado del usuario.

---
## 🔒 9. Protección de Endpoints

El sistema divide las rutas en dos categorías principales para garantizar que solo el personal autorizado acceda a la información sensible.

### Endpoints Públicos (PermitAll)
Estos recursos son accesibles sin necesidad de un token:
* `/usuario` (POST - Registro)
* `/auth/login`
* `/auth/refresh`
* `/auth/forgot-password`
* `/auth/reset-password`
* `/auth/logout`
* `/swagger-ui/**` y `/v3/api-docs/**` (Documentación API)

### Endpoints Protegidos
* **Todo lo demás:** Cualquier otra ruta requiere un **Access Token** válido en el header de la petición.
* **Restricción adicional:** Muchos de estos endpoints requieren, además, un rol específico (ADMIN, MEDICO, etc.) validado por el filtro de seguridad.

---
## 🛡️ 10. ¿Por qué este diseño es seguro?

Este modelo de seguridad ha sido diseñado bajo estándares de grado industrial para mitigar los vectores de ataque más comunes:

* **✔ Access tokens con expiración corta:** Minimiza el tiempo de uso en caso de robo del token.
* **✔ Refresh tokens almacenados en BD:** Permite al administrador revocar sesiones sospechosas de forma instantánea.
* **✔ Rotación obligatoria:** Detecta automáticamente el uso malintencionado de tokens antiguos.
* **✔ Logout seguro:** Basado en revocación real en el lado del servidor, no solo borrado en el cliente.
* **✔ Tokens de confirmación temporales:** Los procesos de email y reset tienen expiración estricta y uso único.
* **✔ Autorización por roles:** El JWT transporta los permisos de forma íntegra y segura.
* **✔ Compatibilidad Multi-plataforma:** Al no usar sesiones ni cookies, es 100% compatible con Apps móviles y SPAs (React, Angular, Vue).
* **✔ Escalabilidad:** El diseño *Stateless* permite que la aplicación crezca entre múltiples instancias de servidor sin pérdida de datos de sesión.

---

## Documentación en Swagger

La documentación completa y detallada de la API está disponible en el endpoint `/swagger-ui`, donde puedes probar cada endpoint y ver la estructura de los datos esperados.

## Tecnologías Utilizadas

- **Java 17**
- **Spring Boot**: Framework principal para crear aplicaciones RESTful.
- **Spring Security**: Para la autenticación y autorización.
- **JWT**: Autenticación con tokens.
- **JPA / Hibernate**: Para la persistencia de datos.
- **MySQL** y **H2** (ambos soportados): Bases de datos.
- **Swagger**: Documentación interactiva de la API.
- **Flyway**: Migraciones de la base de datos.

## Dependencias

Algunas de las principales dependencias usadas en el proyecto incluyen:
- `spring-boot-starter-web`
- `spring-boot-starter-security`
- `spring-boot-starter-data-jpa`
- `springdoc-openapi-starter-webmvc-ui` para Swagger
- `java-jwt` para gestión de JWT
- `mysql-connector-j` para la conexión con MySQL

## Implementación de Tests

La API cuenta con una suite de tests para garantizar el correcto funcionamiento de las funcionalidades. Los tests se implementaron usando `JUnit` y `MockMvc` para verificar los escenarios de consultas en el controlador:

- **Escenario 1**: Retorna un estado HTTP 400 cuando los datos ingresados son inválidos.
- **Escenario 2**: Retorna un estado HTTP 200 cuando los datos ingresados son válidos y se genera correctamente la consulta.

El controlador de consultas se somete a estas pruebas unitarias para verificar que la API responde con los códigos de estado adecuados y que el contenido JSON devuelto es el esperado.

## Instalación

1. **Clonar el repositorio**:
    ```bash
    git clone <url-del-repositorio>
    ```

2. **Configurar la base de datos**: Asegúrate de tener una base de datos MySQL o H2 configurada y actualiza el archivo `application.properties` con las credenciales.

3. **Ejecutar la aplicación**:
    ```bash
    ./mvnw spring-boot:run
    ```

## Uso

Con la aplicación en ejecución, puedes acceder a:
- **Swagger UI**: [http://localhost:8080/swagger-ui/](http://localhost:8080/swagger-ui/) para probar los endpoints.
- **API**: Comienza a interactuar con los endpoints según lo documentado en Swagger.

---
