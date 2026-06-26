package med.voll.api.domain.consulta.dto;

import med.voll.api.domain.consulta.model.Consulta;
import med.voll.api.domain.consulta.model.enumerator.MotivoCancelamiento;

import java.time.LocalDateTime;

public record DatosListadoConsultaDTO(
        Long id,
        Long idMedico,
        String medicoNombre,
        Long idPaciente,
        String pacienteNombre,
        LocalDateTime fecha,
        Boolean cancelada,
        MotivoCancelamiento motivoCancelamiento,
        Boolean reprogramadaPendiente,
        LocalDateTime fechaPropuesta,
        Boolean propuestaPorMedico
) {
    public DatosListadoConsultaDTO(Consulta c) {
        this(
                c.getId(),
                c.getMedico().getId(),
                c.getMedico().getNombre(),
                c.getPaciente().getId(),
                c.getPaciente().getNombre(),
                c.getFecha(),
                c.getCancelada(),
                c.getMotivoCancelamiento(),
                c.getReprogramadaPendiente(),
                c.getFechaPropuesta(),
                c.getPropuestaPorMedico()
        );
    }
}
