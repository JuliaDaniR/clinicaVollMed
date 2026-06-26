CREATE TABLE historias_clinicas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    paciente_id BIGINT NOT NULL UNIQUE,
    fecha_creacion DATE NOT NULL,

    CONSTRAINT pk_historia PRIMARY KEY (id),

    CONSTRAINT fk_historia_paciente
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);


CREATE TABLE notas_clinicas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    historia_clinica_id BIGINT NOT NULL,
    medico_id BIGINT NOT NULL,
    fecha DATE NOT NULL,
    contenido TEXT NOT NULL,

    CONSTRAINT pk_notas PRIMARY KEY (id),

    CONSTRAINT fk_notas_historia
        FOREIGN KEY (historia_clinica_id) REFERENCES historias_clinicas(id),

    CONSTRAINT fk_notas_medico
        FOREIGN KEY (medico_id) REFERENCES medicos(id)
);

