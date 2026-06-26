package med.voll.api.domain.usuarios.dto;

import med.voll.api.domain.usuarios.model.Usuario;

public record DatosListadoUsuario(
        Long id,
        String email,
        String rol,
        Boolean activo,
        String dni
) {
    public DatosListadoUsuario(Usuario usuario) {
        this(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getRoles().isEmpty() ? "" : usuario.getRoles().iterator().next().getNombre().name().replace("ROLE_", ""),
                usuario.getActivo(),
                usuario.getDni()
        );
    }
}
