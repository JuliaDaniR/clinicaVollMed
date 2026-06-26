ALTER TABLE consultas 
ADD COLUMN reprogramada_pendiente TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN fecha_propuesta DATETIME NULL,
ADD COLUMN propuesta_por_medico TINYINT(1) NOT NULL DEFAULT 0;
