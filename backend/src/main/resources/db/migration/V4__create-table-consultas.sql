CREATE TABLE consultas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    medico_id BIGINT NOT NULL,
    paciente_id BIGINT NOT NULL,

    fecha DATETIME NOT NULL,
    cancelada TINYINT(1) NOT NULL DEFAULT 0,
    motivo_cancelamiento VARCHAR(100),

    CONSTRAINT fk_consulta_medico
        FOREIGN KEY (medico_id) REFERENCES medicos(id),

    CONSTRAINT fk_consulta_paciente
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);
