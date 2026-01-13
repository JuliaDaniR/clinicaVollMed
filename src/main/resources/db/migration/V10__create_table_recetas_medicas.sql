CREATE TABLE recetas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    paciente_id BIGINT NOT NULL,
    medico_id BIGINT NOT NULL,
    consulta_id BIGINT NULL,
    fecha DATE NOT NULL,
    indicaciones TEXT NOT NULL,

    CONSTRAINT pk_recetas PRIMARY KEY (id),

    CONSTRAINT fk_recetas_paciente
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id),

    CONSTRAINT fk_recetas_medico
        FOREIGN KEY (medico_id) REFERENCES medicos(id),

    CONSTRAINT fk_recetas_consulta
        FOREIGN KEY (consulta_id) REFERENCES consultas(id)
);
