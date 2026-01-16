ALTER TABLE usuarios
    ADD COLUMN created_at DATETIME NOT NULL,
    ADD COLUMN updated_at DATETIME,
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100),
    ADD COLUMN deleted_at DATETIME,
    ADD COLUMN deleted_by VARCHAR(100);

ALTER TABLE medicos
    ADD COLUMN created_at DATETIME NOT NULL,
    ADD COLUMN updated_at DATETIME,
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100),
    ADD COLUMN deleted_at DATETIME,
    ADD COLUMN deleted_by VARCHAR(100);

ALTER TABLE pacientes
    ADD COLUMN created_at DATETIME NOT NULL,
    ADD COLUMN updated_at DATETIME,
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100),
    ADD COLUMN deleted_at DATETIME,
    ADD COLUMN deleted_by VARCHAR(100);

ALTER TABLE consultas
    ADD COLUMN created_at DATETIME NOT NULL,
    ADD COLUMN updated_at DATETIME,
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100),
    ADD COLUMN deleted_at DATETIME,
    ADD COLUMN deleted_by VARCHAR(100);

ALTER TABLE historias_clinicas
    ADD COLUMN created_at DATETIME NOT NULL,
    ADD COLUMN updated_at DATETIME,
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100),
    ADD COLUMN deleted_at DATETIME,
    ADD COLUMN deleted_by VARCHAR(100);

ALTER TABLE notas_clinicas
    ADD COLUMN created_at DATETIME NOT NULL,
    ADD COLUMN updated_at DATETIME,
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100),
    ADD COLUMN deleted_at DATETIME,
    ADD COLUMN deleted_by VARCHAR(100);

ALTER TABLE recetas
    ADD COLUMN created_at DATETIME NOT NULL,
    ADD COLUMN updated_at DATETIME,
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100),
    ADD COLUMN deleted_at DATETIME,
    ADD COLUMN deleted_by VARCHAR(100);