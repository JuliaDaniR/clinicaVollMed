package med.voll.api.domain.medico.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.medico.dto.*;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.medico.repository.MedicoRepository;
import med.voll.api.domain.usuarios.dto.DatosActualizarUsuario;
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
public class MedicoService {

    private final MedicoRepository medicoRepository;
    private final UsuarioService usuarioService;

    // ==========================================================
    // 1. Registrar médico (Admin/Recepción)
    // ==========================================================
    @Transactional
    public ApiResponseDTO registrar(DatosRegistroMedico dto) {

        Usuario usuario = usuarioService.crearUsuarioDesdeServicio(
                new DatosRegistroUsuario(
                        dto.email(),
                        dto.clave(),
                        dto.nombre(),
                        dto.telefono(),
                        dto.dni(),
                        RolEntrada.MEDICO
                )
        );

        Medico medico = new Medico(dto, usuario);
        medicoRepository.save(medico);

        return new ApiResponseDTO(
                true,
                "Médico registrado correctamente",
                new DatosRespuestaMedico(medico),
                HttpStatus.CREATED
        );
    }

    // ==========================================================
    // 2. Actualizar médico por ID
    // ==========================================================
    @Transactional
    public ApiResponseDTO actualizarPerfil(Long medicoId,
                                           DatosActualizarMedico dto,
                                           String emailActual) {

        Medico medico = medicoRepository.findById(medicoId)
                .orElseThrow(() -> new EntityNotFoundException("Médico no encontrado"));

        usuarioService.actualizarUsuario(
                medico.getUsuario().getId(),
                new DatosActualizarUsuario(null, null, null),
                emailActual
        );

        medico.actualizar(dto);

        return new ApiResponseDTO(
                true,
                "Médico actualizado correctamente",
                new DatosRespuestaMedico(medico),
                HttpStatus.OK
        );
    }

    // ==========================================================
    // 3. Médico actualiza su propio perfil
    // ==========================================================
    @Transactional
    public ApiResponseDTO actualizarMiPerfil(DatosActualizarPerfilMedico dto,
                                             String emailActual) {

        Medico medico = medicoRepository.findByUsuarioEmail(emailActual)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No se encontró el médico asociado al usuario actual"
                ));

        usuarioService.actualizarUsuario(
                medico.getUsuario().getId(),
                new DatosActualizarUsuario(
                        dto.nombre(),
                        dto.telefono(),
                        dto.dni()
                ),
                emailActual
        );

        medico.actualizar(new DatosActualizarMedico(
                medico.getId(),
                dto.matricula(),
                dto.especialidad(),
                dto.direccion()
        ));

        return new ApiResponseDTO(
                true,
                "Perfil actualizado correctamente",
                new DatosRespuestaMedico(medico),
                HttpStatus.OK
        );
    }

    // ==========================================================
    // 4. Activar / Desactivar médico
    // ==========================================================
    @Transactional
    public ApiResponseDTO desactivar(Long medicoId, Usuario auth) {

        validarPermisos(auth, rolesPermitidos(Rol.NombreRol.ROLE_ADMIN));

        Medico medico = medicoRepository.findById(medicoId)
                .orElseThrow(() -> new EntityNotFoundException("Médico no encontrado"));

        medico.desactivar(auth.getEmail());
        usuarioService.desactivar(medico.getUsuario().getId(), auth);

        return new ApiResponseDTO(
                true,
                "Médico desactivado",
                null,
                HttpStatus.OK
        );
    }

    @Transactional
    public ApiResponseDTO activar(Long medicoId, Usuario auth) {

        validarPermisos(auth, rolesPermitidos(Rol.NombreRol.ROLE_ADMIN));

        Medico medico = medicoRepository.findById(medicoId)
                .orElseThrow(() -> new EntityNotFoundException("Médico no encontrado"));

        medico.activar();
        usuarioService.activar(medico.getUsuario().getId(), auth);

        return new ApiResponseDTO(
                true,
                "Médico activado",
                null,
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
    // ==========================================================
    // 5. Obtener / Listar
    // ==========================================================
    public ApiResponseDTO obtener(Long id) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Médico no encontrado"));

        return new ApiResponseDTO(
                true,
                "Médico encontrado",
                new DatosRespuestaMedico(medico),
                HttpStatus.OK
        );
    }

    public ApiResponseDTO listar(Pageable pageable) {

        Page<DatosListadoMedico> lista =
                medicoRepository.findAll(pageable).map(DatosListadoMedico::new);

        return new ApiResponseDTO(
                true,
                "Listado de médicos obtenido",
                lista,
                HttpStatus.OK
        );
    }
}
