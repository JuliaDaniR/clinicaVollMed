CREATE TABLE pacientes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    usuario_id BIGINT NOT NULL UNIQUE,

    activo TINYINT(1) NOT NULL DEFAULT 1,

    calle VARCHAR(100),
    numero VARCHAR(20),
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    pais VARCHAR(100),

    fecha_alta DATE NOT NULL,

    CONSTRAINT fk_paciente_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
