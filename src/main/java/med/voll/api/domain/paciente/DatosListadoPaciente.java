package med.voll.api.domain.paciente;

public record DatosListadoPaciente(Long id,
                                   String nombre,
                                   String documentoIdentidad,
                                   String email) {

    public DatosListadoPaciente(Paciente paciente){
        this(paciente.getId(), paciente.getNombre(), paciente.getDocumentoIdentidad(), paciente.getEmail());
    }
}
