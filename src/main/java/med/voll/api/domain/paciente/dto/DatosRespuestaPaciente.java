package med.voll.api.domain.paciente.dto;

import med.voll.api.domain.direccion.DatosDireccion;
import med.voll.api.domain.paciente.model.Paciente;

import java.time.LocalDate;

public record DatosRespuestaPaciente(
        Long id,
        String nombre,
        String email,
        String telefono,
        String dni,
        Boolean activo,
        DatosDireccion direccion,
        LocalDate fechaAlta
) {

    public DatosRespuestaPaciente(Paciente paciente) {
        this(
                paciente.getId(),
                paciente.getUsuario().getNombre(),
                paciente.getUsuario().getEmail(),
                paciente.getUsuario().getTelefono(),
                paciente.getUsuario().getDni(),
                paciente.getActivo(),
                paciente.getDireccion() != null ? new DatosDireccion(
                        paciente.getDireccion().getCalle(),
                        paciente.getDireccion().getCiudad(),
                        paciente.getDireccion().getNumero(),
                        paciente.getDireccion().getProvincia(),
                        paciente.getDireccion().getPais()
                ) : null,
                paciente.getFechaAlta()
        );
    }
}
