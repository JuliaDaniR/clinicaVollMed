package med.voll.api.domain.ia.dto;

public record DatosRespuestaAsistenciaDTO(
        Boolean success,
        String textoAsistido,
        Boolean iaDisponible
) {
}
