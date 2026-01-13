CREATE TABLE refresh_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    token VARCHAR(200) NOT NULL UNIQUE,
    expiracion DATETIME NOT NULL,
    revoked TINYINT(1) NOT NULL DEFAULT 0,

    CONSTRAINT fk_refresh_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);
