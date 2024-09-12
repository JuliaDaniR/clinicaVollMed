package med.voll.api.domain.consulta;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import med.voll.api.domain.medico.Especialidad;

import java.time.LocalDateTime;

public record DatosAgendarConsulta(
        Long id,
        @NotNull Long idPaciente,
        Long idMedico, 
        @NotNull
        @Future
        @JsonFormat(pattern = "dd-MM-yyyy HH:mm")
        LocalDateTime fecha,
        Especialidad especialidad) {

    
     public static record DatosActualizarConsulta(
             @NotNull Long id,
             Long idPaciente,
             Long idMedico,
             MotivoCancelamiento motivoCancelamiento) {
    }
}
