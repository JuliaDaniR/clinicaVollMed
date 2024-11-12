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

### Autenticación

| Método | Endpoint   | Descripción                      |
|--------|------------|----------------------------------|
| POST   | `/login`   | Autenticar y generar token JWT   |

## Seguridad

La API utiliza **JWT (JSON Web Tokens)** para proteger las rutas. Cada solicitud a un endpoint seguro debe incluir un token válido en el encabezado `Authorization`.

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
