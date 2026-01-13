package med.voll.api.domain.consulta.validaciones;

import med.voll.api.domain.consulta.model.enumerator.MotivoCancelamiento;

public record DatosCancelamientoConsulta(Long idConsulta , MotivoCancelamiento motivo) {
}
