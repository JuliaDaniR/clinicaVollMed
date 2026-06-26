CREATE TABLE email_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    token VARCHAR(200) NOT NULL,
    nuevo_email VARCHAR(150) NOT NULL,
    expiracion DATETIME NOT NULL,

    CONSTRAINT fk_email_token_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);
