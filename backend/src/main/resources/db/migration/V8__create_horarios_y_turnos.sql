-- ============================================================
--   CONFIGURACIÓN HORARIA DEL MÉDICO
-- ============================================================
CREATE TABLE configuracion_horaria_medico (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    medico_id BIGINT NOT NULL,
    activa TINYINT(1) NOT NULL DEFAULT 1,
    duracion_minutos_personalizada INT NULL,

    CONSTRAINT fk_config_medico
        FOREIGN KEY (medico_id) REFERENCES medicos(id)
);

-- ============================================================
--   BLOQUES HORARIOS (por día)
-- ============================================================
CREATE TABLE dia_horario_medico (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dia VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    configuracion_id BIGINT NOT NULL,

    CONSTRAINT fk_dia_config
        FOREIGN KEY (configuracion_id) REFERENCES configuracion_horaria_medico(id)
);

-- ============================================================
--   TURNOS DISPONIBLES
-- ============================================================
CREATE TABLE turnos_disponibles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    medico_id BIGINT NOT NULL,
    estado VARCHAR(20) NOT NULL,

    CONSTRAINT fk_turno_medico
        FOREIGN KEY (medico_id) REFERENCES medicos(id),

    -- Evita turnos duplicados
    CONSTRAINT uk_turno_unico UNIQUE (medico_id, fecha, hora)
);
