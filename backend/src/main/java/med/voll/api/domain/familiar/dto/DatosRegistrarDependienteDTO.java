package med.voll.api.domain.familiar.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import med.voll.api.domain.direccion.DatosDireccion;
import med.voll.api.domain.familiar.model.Parentesco;

import java.time.LocalDate;

public record DatosRegistrarDependienteDTO(
    @NotBlank(message = "Nombre es obligatorio")
    String nombre,

    String dni,

    LocalDate fechaNacimiento,

    String telefono,

    @NotNull(message = "Parentesco es obligatorio")
    Parentesco parentesco,

    @Valid
    DatosDireccion direccion
) {}
