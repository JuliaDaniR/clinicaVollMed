package med.voll.api.domain.paciente.dto;

import med.voll.api.domain.paciente.model.Paciente;

public record DatosListadoPaciente(
        Long id,
        String nombre,
        String email,
        Boolean activo
) {
    public DatosListadoPaciente(Paciente p) {
        this(
                p.getId(),
                p.getUsuario().getNombre(),
                p.getUsuario().getEmail(),
                p.getActivo()
        );
    }
}
