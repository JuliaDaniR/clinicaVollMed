package med.voll.api.domain.historial.service;

import lombok.RequiredArgsConstructor;
import med.voll.api.domain.historial.domain.HistoriaClinica;
import med.voll.api.domain.historial.domain.NotaClinica;
import med.voll.api.domain.historial.dto.DatosCrearNotaClinica;
import med.voll.api.domain.historial.dto.DatosHistoriaClinica;
import med.voll.api.domain.historial.dto.DatosNotaClinica;
import med.voll.api.domain.historial.repository.HistoriaClinicaRepository;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.medico.repository.MedicoRepository;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.paciente.repository.IPacienteRepository;
import med.voll.api.domain.usuarios.model.Rol;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.infra.errores.ApiResponseDTO;
import med.voll.api.infra.errores.ValidacionIntegridad;
import med.voll.api.infra.security.AutenticacionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class HistoriaClinicaService {

    private final HistoriaClinicaRepository historiaRepo;
    private final IPacienteRepository pacienteRepo;
    private final MedicoRepository medicoRepo;
    private final AutenticacionService authService;

    // ==========================================================
    // 1. OBTENER HISTORIA CLÍNICA
    // ==========================================================
    @Transactional(readOnly = true)
    public ApiResponseDTO obtenerPorPaciente(Long pacienteId) {

        Usuario auth = authService.getUsuarioAutenticado();

        HistoriaClinica hc = historiaRepo
                .findByPacienteId(pacienteId)
                .orElseThrow(() -> new ValidacionIntegridad("Historia clínica no encontrada"));

        validarPermisosLectura(auth, hc.getPaciente());

        return new ApiResponseDTO(
                true,
                "Historia clínica encontrada",
                new DatosHistoriaClinica(hc),
                HttpStatus.OK
        );
    }

    // ==========================================================
    // 2. AGREGAR NOTA CLÍNICA
    // ==========================================================
    @Transactional
    public ApiResponseDTO agregarNota(DatosCrearNotaClinica dto) {

        Usuario auth = authService.getUsuarioAutenticado();
        validarEsMedico(auth);

        Paciente paciente = pacienteRepo.findById(dto.pacienteId())
                .orElseThrow(() -> new ValidacionIntegridad("Paciente no encontrado"));

        // medico autenticado = medico que firma
        Medico medico = medicoRepo.findByUsuarioId(auth.getId())
                .orElseThrow(() -> new ValidacionIntegridad("No corresponde a un médico válido"));

        // buscar historia o crear nueva
        HistoriaClinica historia = historiaRepo
                .findByPacienteId(paciente.getId())
                .orElseGet(() -> {
                    HistoriaClinica nueva = new HistoriaClinica();
                    nueva.setPaciente(paciente);
                    nueva.setFechaCreacion(LocalDate.now());
                    return historiaRepo.save(nueva);
                });

        // crear nota
        NotaClinica nota = new NotaClinica();
        nota.setContenido(dto.contenido());
        nota.setMedico(medico);
        nota.setFecha(LocalDate.now());

        // método que activa cascade
        historia.agregarNota(nota);

        return new ApiResponseDTO(
                true,
                "Nota agregada correctamente",
                new DatosNotaClinica(nota),
                HttpStatus.CREATED
        );
    }

    // ==========================================================
    // VALIDADORES
    // ==========================================================
    private void validarEsMedico(Usuario user) {
        if (!user.tieneRol(Rol.NombreRol.ROLE_MEDICO)) {
            throw new ValidacionIntegridad("Solo médicos pueden agregar notas clínicas");
        }
    }

    private void validarPermisosLectura(Usuario user, Paciente paciente) {

        if (user.tieneRol(Rol.NombreRol.ROLE_ADMIN)) return;

        Long uid = user.getId();

        boolean esPaciente = paciente.getUsuario().getId().equals(uid);
        boolean esMedico = paciente.getConsultas()
                .stream()
                .anyMatch(c -> c.getMedico().getUsuario().getId().equals(uid));

        if (!(esPaciente || esMedico)) {
            throw new ValidacionIntegridad("No tienes permiso para ver esta historia clínica");
        }
    }
}

