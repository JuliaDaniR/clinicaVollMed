-- ==============================================================
-- PASO 1: Mover nombre y telefono de usuarios -> pacientes
-- ==============================================================
ALTER TABLE pacientes
    ADD COLUMN nombre      VARCHAR(120) NOT NULL DEFAULT 'Sin nombre',
    ADD COLUMN telefono    VARCHAR(30)  NULL,
    ADD COLUMN dni         VARCHAR(20)  NULL,           -- para dependientes
    ADD COLUMN fecha_nacimiento DATE   NULL,
    MODIFY COLUMN usuario_id BIGINT NULL;               -- dependientes sin usuario

-- Migrar datos existentes
UPDATE pacientes p
    JOIN usuarios u ON p.usuario_id = u.id
SET p.nombre   = u.nombre,
    p.telefono = u.telefono;

-- Quitar el DEFAULT temporal
ALTER TABLE pacientes ALTER COLUMN nombre DROP DEFAULT;

-- ==============================================================
-- PASO 2: Mover nombre y telefono de usuarios -> medicos
-- ==============================================================
ALTER TABLE medicos
    ADD COLUMN nombre   VARCHAR(120) NOT NULL DEFAULT 'Sin nombre',
    ADD COLUMN telefono VARCHAR(30)  NULL;

-- Migrar datos existentes
UPDATE medicos m
    JOIN usuarios u ON m.usuario_id = u.id
SET m.nombre   = u.nombre,
    m.telefono = u.telefono;

-- Quitar el DEFAULT temporal
ALTER TABLE medicos ALTER COLUMN nombre DROP DEFAULT;

-- ==============================================================
-- PASO 3: Limpiar usuarios (solo datos de auth)
-- ==============================================================
ALTER TABLE usuarios
    DROP COLUMN nombre,
    DROP COLUMN telefono;

-- ==============================================================
-- PASO 4: Tabla de grupo familiar
-- ==============================================================
CREATE TABLE grupo_familiar (
    id                       BIGINT NOT NULL AUTO_INCREMENT,
    paciente_titular_id      BIGINT NOT NULL,
    paciente_dependiente_id  BIGINT NOT NULL,
    parentesco               VARCHAR(30) NOT NULL,
    activo                   TINYINT(1) NOT NULL DEFAULT 1,
    fecha_vinculacion        DATE NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_gf_titular
        FOREIGN KEY (paciente_titular_id) REFERENCES pacientes(id),
    CONSTRAINT fk_gf_dependiente
        FOREIGN KEY (paciente_dependiente_id) REFERENCES pacientes(id),
    CONSTRAINT uk_gf_dependiente
        UNIQUE (paciente_dependiente_id)
);
