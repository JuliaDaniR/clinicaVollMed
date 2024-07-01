CREATE TABLE pacientes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    documento_identidad VARCHAR(14) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    calle VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    numero VARCHAR(20),
    distrito VARCHAR(100) NOT NULL,
    complemento VARCHAR(100),
    PRIMARY KEY (id)
);