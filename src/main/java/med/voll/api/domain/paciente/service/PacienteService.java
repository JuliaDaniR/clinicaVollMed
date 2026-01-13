package med.voll.api.domain.paciente.service;

import lombok.RequiredArgsConstructor;
import med.voll.api.domain.paciente.dto.DatosListadoPaciente;
import med.voll.api.domain.paciente.dto.DatosRegistroPaciente;
import med.voll.api.domain.paciente.dto.DatosRespuestaPaciente;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.paciente.repository.IPacienteRepository;
import med.voll.api.domain.usuarios.dto.DatosRegistroUsuario;
import med.voll.api.domain.usuarios.model.Rol;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.domain.usuarios.model.enumerator.RolEntrada;
import med.voll.api.domain.usuarios.service.UsuarioService;
import med.voll.api.infra.errores.ApiResponseDTO;
import med.voll.api.infra.errores.ValidacionIntegridad;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class PacienteService {

    private final IPacienteRepository pacienteRepo;
    private final UsuarioService usuarioService;

    // ==========================================================
    // 1. REGISTRAR PACIENTE
    // ==========================================================
    @Transactional
    public ApiResponseDTO registrar(DatosRegistroPaciente dto) {

        Usuario usuario = usuarioService.crearUsuarioDesdeServicio(
                new DatosRegistroUsuario(
                        dto.email(),
                        dto.clave(),
                        dto.nombre(),
                        dto.telefono(),
                        dto.dni(),
                        RolEntrada.PACIENTE
                )
        );

        Paciente paciente = new Paciente(dto, usuario);
        pacienteRepo.save(paciente);

        return new ApiResponseDTO(
                true,
                "Paciente registrado correctamente",
                new DatosRespuestaPaciente(paciente),
                HttpStatus.CREATED
        );
    }

    // ==========================================================
    // 2. ACTUALIZAR PACIENTE
    // ==========================================================
    @Transactional
    public ApiResponseDTO actualizar(Long id,
                                     DatosRegistroPaciente.DatosActualizarPaciente dto,
                                     String emailActual) {

        Paciente paciente = pacienteRepo.findById(id)
                .orElseThrow(() -> new ValidacionIntegridad("Paciente no encontrado"));

        usuarioService.actualizarDatosBasicos(
                paciente.getUsuario().getId(),
                dto.nombre(),
                dto.telefono(),
                emailActual
        );

        paciente.actualizar(dto);

        return new ApiResponseDTO(
                true,
                "Paciente actualizado correctamente",
                new DatosRespuestaPaciente(paciente),
                HttpStatus.OK
        );
    }

    // ==========================================================
    // 3. DESACTIVAR PACIENTE
    // ==========================================================
    @Transactional
    public ApiResponseDTO desactivar(Long id, Usuario auth) {

        validarPermisos(auth,
                rolesPermitidos(Rol.NombreRol.ROLE_ADMIN, Rol.NombreRol.ROLE_RECEPCIONISTA));

        Paciente paciente = pacienteRepo.findById(id)
                .orElseThrow(() -> new ValidacionIntegridad("Paciente no encontrado"));

        usuarioService.desactivar(paciente.getUsuario().getId(), auth);
        paciente.desactivar(auth.getEmail());

        return new ApiResponseDTO(
                true,
                "Paciente desactivado correctamente",
                null,
                HttpStatus.NO_CONTENT
        );
    }

    // ==========================================================
    // 4. ACTIVAR PACIENTE
    // ==========================================================
    @Transactional
    public ApiResponseDTO activar(Long id, Usuario auth) {

        validarPermisos(auth,
                rolesPermitidos(Rol.NombreRol.ROLE_ADMIN, Rol.NombreRol.ROLE_RECEPCIONISTA));

        Paciente paciente = pacienteRepo.findById(id)
                .orElseThrow(() -> new ValidacionIntegridad("Paciente no encontrado"));

        usuarioService.activar(paciente.getUsuario().getId(), auth);
        paciente.activar();

        return new ApiResponseDTO(
                true,
                "Paciente activado correctamente",
                new DatosRespuestaPaciente(paciente),
                HttpStatus.OK
        );
    }

    // ==========================================================
    // 5. OBTENER PACIENTE
    // ==========================================================
    public ApiResponseDTO obtener(Long id) {
        Paciente paciente = pacienteRepo.findById(id)
                .orElseThrow(() -> new ValidacionIntegridad("Paciente no encontrado"));

        return new ApiResponseDTO(
                true,
                "Paciente encontrado",
                new DatosRespuestaPaciente(paciente),
                HttpStatus.OK
        );
    }

    // ==========================================================
    // 6. LISTAR PACIENTES
    // ==========================================================
    public ApiResponseDTO listar(Pageable pageable) {

        Page<DatosListadoPaciente> page = pacienteRepo.findAll(pageable)
                .map(DatosListadoPaciente::new);

        return new ApiResponseDTO(
                true,
                "Listado de pacientes obtenido",
                page,
                HttpStatus.OK
        );
    }


    // ==========================================================
    // PERMISOS
    // ==========================================================
    private void validarPermisos(Usuario auth, Set<Rol.NombreRol> permitidos) {

        boolean permitido = auth.getRoles().stream()
                .map(Rol::getNombre)
                .anyMatch(permitidos::contains);

        if (!permitido) {
            throw new ValidacionIntegridad("No tienes permisos para realizar esta acción");
        }
    }

    private Set<Rol.NombreRol> rolesPermitidos(Rol.NombreRol... roles) {
        return Set.of(roles);
    }
}

