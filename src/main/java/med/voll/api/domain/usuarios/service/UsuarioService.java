package med.voll.api.domain.usuarios.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.usuarios.dto.DatosActualizarRol;
import med.voll.api.domain.usuarios.dto.DatosActualizarUsuario;
import med.voll.api.domain.usuarios.dto.DatosCambioPassword;
import med.voll.api.domain.usuarios.dto.DatosRegistroUsuario;
import med.voll.api.domain.usuarios.model.Rol;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.domain.usuarios.repository.IRolRepository;
import med.voll.api.domain.usuarios.repository.IUsuarioRepository;
import med.voll.api.infra.errores.ApiResponseDTO;
import med.voll.api.infra.errores.ValidacionIntegridad;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final IUsuarioRepository usuarioRepository;
    private final IRolRepository rolRepository;
    private final PasswordEncoder encoder;

    // ==========================================================
    // MÉTODO CENTRAL INTERNO
    // ==========================================================
    @Transactional
    private Usuario crearUsuarioInterno(
            String email,
            String clave,
            String nombre,
            String telefono,
            String dni,
            Rol.NombreRol rolNombre
    ) {

        if (usuarioRepository.existsByEmail(email)) {
            throw new ValidacionIntegridad("Ya existe un usuario con ese email");
        }

        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseThrow(() -> new ValidacionIntegridad("Rol no existe"));


        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setClave(encoder.encode(clave));
        usuario.setNombre(nombre);
        usuario.setTelefono(telefono);
        usuario.setDni(dni);
        usuario.getRoles().add(rol);
        usuario.setActivo(true);

        return usuarioRepository.save(usuario);
    }

    @Transactional
    public ApiResponseDTO registrarUsuario(
            DatosRegistroUsuario datos,
            UriComponentsBuilder uriBuilder
    ) {

        Rol.NombreRol rolSolicitado = datos.rol().toNombreRol();

        if (rolSolicitado != Rol.NombreRol.ROLE_ADMIN &&
                rolSolicitado != Rol.NombreRol.ROLE_RECEPCIONISTA) {

            throw new ValidacionIntegridad(
                    "Solo se pueden registrar usuarios administrativos desde /usuario. " +
                            "Para registrar médicos use /medicos y para pacientes use /pacientes."
            );
        }

        Usuario usuario = crearUsuarioInterno(
                datos.email(),
                datos.clave(),
                datos.nombre(),
                datos.telefono(),
                datos.dni(),
                rolSolicitado
        );

        var uri = uriBuilder.path("/usuario/{id}")
                .buildAndExpand(usuario.getId())
                .toUri();

        return new ApiResponseDTO(
                true,
                "Usuario creado exitosamente",
                Map.of("id", usuario.getId()),
                HttpStatus.CREATED
        );
    }


    // ==========================================================
    // MÉTODO PARA OTROS SERVICIOS (MÉDICO, PACIENTE, RECEPCIÓN, ETC.)
    // ==========================================================
    @Transactional
    public Usuario crearUsuarioDesdeServicio(DatosRegistroUsuario datos) {

        return crearUsuarioInterno(
                datos.email(),
                datos.clave(),
                datos.nombre(),
                datos.telefono(),
                datos.dni(),
                datos.rol().toNombreRol()
        );
    }

    @Transactional
    public ApiResponseDTO actualizarRol(Long id, DatosActualizarRol datos) {

        if (!esAdmin()) {
            return new ApiResponseDTO(false,
                    "No autorizado. Solo un administrador puede cambiar roles.",
                    null,
                    HttpStatus.FORBIDDEN);
        }

        var usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        if (usuario.isDeleted()) {
            return new ApiResponseDTO(false,
                    "El usuario está desactivado",
                    null,
                    HttpStatus.BAD_REQUEST);
        }

        Rol.NombreRol nuevoRol;
        try {
            nuevoRol = Rol.NombreRol.valueOf("ROLE_" + datos.rol().toUpperCase());
        } catch (Exception e) {
            return new ApiResponseDTO(false,
                    "Rol inválido: debe ser ADMIN, RECEPCIONISTA o MEDICO",
                    null,
                    HttpStatus.BAD_REQUEST);
        }

        var rol = rolRepository.findByNombre(nuevoRol)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado en BD"));

        usuario.getRoles().clear();
        usuario.getRoles().add(rol);

        return new ApiResponseDTO(true,
                "Rol actualizado correctamente",
                Map.of("usuarioId", usuario.getId(), "nuevoRol", datos.rol()),
                HttpStatus.OK);
    }

    @Transactional
    public ApiResponseDTO actualizarUsuario(Long id, DatosActualizarUsuario datos, String usuarioActual) {

        var usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        if (!usuario.getEmail().equals(usuarioActual)) {
            throw new ValidationException("No tienes permiso para modificar este usuario");
        }

        if (datos.nombre() != null) usuario.setNombre(datos.nombre());
        if (datos.telefono() != null) usuario.setTelefono(datos.telefono());
        if (datos.dni() != null) usuario.setDni(datos.dni());

        return new ApiResponseDTO(
                true,
                "Usuario actualizado correctamente",
                Map.of("id", usuario.getId()),
                HttpStatus.OK
        );
    }

    @Transactional
    public Usuario actualizarDatosBasicos(Long id, String nombre, String telefono, String emailActual) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        if (!usuario.getEmail().equals(emailActual)) {
            throw new ValidationException("No tienes permiso para modificar este usuario");
        }

        if (nombre != null) usuario.setNombre(nombre);
        if (telefono != null) usuario.setTelefono(telefono);

        return usuario;
    }

    @Transactional
    public ApiResponseDTO desactivar(Long id, Usuario auth) {

        validarPermisos(auth,
                rolesPermitidos(Rol.NombreRol.ROLE_ADMIN));

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        usuario.desactivar(auth.getEmail());

        return new ApiResponseDTO(
                true,
                "Usuario desactivado",
                Map.of("id", usuario.getId()),
                HttpStatus.OK
        );
    }

    @Transactional
    public ApiResponseDTO activar(Long id, Usuario auth) {

        validarPermisos(auth,
                rolesPermitidos(Rol.NombreRol.ROLE_ADMIN));

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        usuario.activar();

        return new ApiResponseDTO(
                true,
                "Usuario activado",
                Map.of("id", usuario.getId()),
                HttpStatus.OK
        );
    }

    private void validarPermisos(Usuario auth, Set<Rol.NombreRol> permitidos) {

        boolean tienePermiso = auth.getRoles().stream()
                .map(Rol::getNombre)
                .anyMatch(permitidos::contains);

        if (!tienePermiso) {
            throw new ValidacionIntegridad("No tienes permisos para realizar esta acción");
        }
    }

    private Set<Rol.NombreRol> rolesPermitidos(Rol.NombreRol... roles) {
        return Set.of(roles);
    }
    @Transactional
    public ApiResponseDTO cambiarPassword(Long id,
                                          DatosCambioPassword datos,
                                          String emailUsuarioActual) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        // 🔒 Solo puede modificar su propia contraseña
        if (!usuario.getEmail().equals(emailUsuarioActual)) {
            throw new ValidationException("No tienes permiso para cambiar esta contraseña");
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // Validar contraseña actual
        if (!encoder.matches(datos.passwordActual(), usuario.getClave())) {
            throw new ValidationException("La contraseña actual es incorrecta");
        }

        // Validar coincidencia
        if (!datos.nuevaPassword().equals(datos.repetirPassword())) {
            throw new ValidationException("La contraseña nueva no coincide en ambas entradas");
        }

        // Guardar nueva contraseña encriptada
        usuario.setClave(encoder.encode(datos.nuevaPassword()));

        return new ApiResponseDTO(
                true,
                "Contraseña actualizada correctamente",
                null,
                HttpStatus.OK
        );
    }

    // Útil para verificar roles
    private boolean esAdmin() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
