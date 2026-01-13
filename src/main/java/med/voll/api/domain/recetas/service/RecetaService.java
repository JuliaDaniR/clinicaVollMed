package med.voll.api.domain.recetas.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.consulta.model.Consulta;
import med.voll.api.domain.consulta.repository.IConsultaRepository;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.medico.repository.MedicoRepository;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.paciente.repository.IPacienteRepository;
import med.voll.api.domain.recetas.domain.RecetaMedica;
import med.voll.api.domain.recetas.dto.DatosCrearReceta;
import med.voll.api.domain.recetas.repository.RecetaMedicaRepository;
import med.voll.api.domain.usuarios.model.Rol;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.infra.errores.ApiResponseDTO;
import med.voll.api.infra.errores.ValidacionIntegridad;
import med.voll.api.infra.security.AutenticacionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecetaService {

    private final RecetaMedicaRepository recetaRepo;
    private final IPacienteRepository pacienteRepo;
    private final MedicoRepository medicoRepo;
    private final IConsultaRepository consultaRepo;
    private final AutenticacionService authService;

    // ==========================================================
    // 1. CREAR RECETA
    // ==========================================================
    @Transactional
    public ApiResponseDTO crear(DatosCrearReceta dto) {

        Usuario auth = authService.getUsuarioAutenticado();
        validarEsMedico(auth);

        Paciente paciente = pacienteRepo.findById(dto.idPaciente())
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));

        Medico medico = medicoRepo.findByUsuarioId(auth.getId())
                .orElseThrow(() -> new ValidacionIntegridad("El usuario autenticado no corresponde a un médico"));

        Consulta consulta = null;

        if (dto.idConsulta() != null) {
            consulta = consultaRepo.findById(dto.idConsulta())
                    .orElseThrow(() -> new EntityNotFoundException("Consulta no encontrada"));
        }

        RecetaMedica receta = new RecetaMedica(dto, medico, paciente, consulta);
        recetaRepo.save(receta);

        return new ApiResponseDTO(
                true,
                "Receta creada correctamente",
                Map.of("id", receta.getId()),
                HttpStatus.CREATED
        );
    }

    // ==========================================================
    // 2. OBTENER RECETA
    // ==========================================================
    @Transactional(readOnly = true)
    public ApiResponseDTO obtener(Long id) {

        Usuario auth = authService.getUsuarioAutenticado();

        RecetaMedica receta = recetaRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Receta no encontrada"));

        validarPermisosLectura(auth, receta);

        return new ApiResponseDTO(
                true,
                "Receta encontrada",
                receta.toDTO(),
                HttpStatus.OK
        );
    }

    // ==========================================================
    // VALIDACIONES DE PERMISOS
    // ==========================================================
    private void validarEsMedico(Usuario user) {
        if (!user.tieneRol(Rol.NombreRol.ROLE_MEDICO)) {
            throw new ValidacionIntegridad("Solo los médicos pueden prescribir recetas");
        }
    }

    private void validarPermisosLectura(Usuario user, RecetaMedica receta) {

        if (user.tieneRol(Rol.NombreRol.ROLE_ADMIN)) return;

        Long userId = user.getId();

        boolean esMedico = receta.getMedico().getUsuario().getId().equals(userId);
        boolean esPaciente = receta.getPaciente().getUsuario().getId().equals(userId);
        boolean esRecepcion = user.tieneRol(Rol.NombreRol.ROLE_RECEPCIONISTA);

        if (!(esMedico || esPaciente || esRecepcion)) {
            throw new ValidacionIntegridad("No tienes permiso para ver esta receta");
        }
    }
}
