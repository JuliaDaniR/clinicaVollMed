CREATE TABLE medicos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    usuario_id BIGINT NOT NULL UNIQUE,

    matricula VARCHAR(50) NOT NULL,
    especialidad VARCHAR(50) NOT NULL,

    calle VARCHAR(100),
    numero VARCHAR(20),
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    pais VARCHAR(100),

    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_alta DATE NOT NULL,

    CONSTRAINT fk_medico_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
