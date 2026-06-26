-- ==========================================
--  TABLA USUARIOS
-- ==========================================

CREATE TABLE usuarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    clave VARCHAR(255) NOT NULL,

    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(30),
    dni VARCHAR(20),

    activo TINYINT(1) NOT NULL DEFAULT 1,

    PRIMARY KEY (id),

    UNIQUE KEY uk_usuario_email (email),
    UNIQUE KEY uk_usuario_dni (dni)
);


-- =====================
--  TABLA DE ROLES
-- =====================
CREATE TABLE roles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

-- ====================================
--  TABLA INTERMEDIA usuario_roles
-- ====================================
CREATE TABLE usuario_roles (
    usuario_id BIGINT NOT NULL,
    rol_id BIGINT NOT NULL,

    PRIMARY KEY (usuario_id, rol_id),

    CONSTRAINT fk_usuario_roles_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_usuario_roles_rol
        FOREIGN KEY (rol_id) REFERENCES roles(id)
        ON DELETE CASCADE
);

-- ==================================
--  INSERT DE ROLES BASE DEL SISTEMA
-- ==================================
INSERT INTO roles (nombre) VALUES
 ('ROLE_ADMIN'),
 ('ROLE_RECEPCIONISTA'),
 ('ROLE_MEDICO'),
 ('ROLE_PACIENTE');

