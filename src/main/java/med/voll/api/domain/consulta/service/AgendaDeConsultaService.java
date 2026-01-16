package med.voll.api.domain.consulta.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import med.voll.api.domain.consulta.dto.DatosDetalleConsulta;
import med.voll.api.domain.consulta.dto.DatosReprogramarConsulta;
import med.voll.api.domain.consulta.model.Consulta;
import med.voll.api.domain.consulta.validaciones.DatosCancelamientoConsulta;
import med.voll.api.domain.consulta.validaciones.DatosValidacionConsulta;
import med.voll.api.domain.consulta.validaciones.ValidadorDeConsultas;
import med.voll.api.domain.horario.model.TurnoDisponible;
import med.voll.api.domain.horario.model.enumerator.EstadoTurno;
import med.voll.api.domain.horario.repository.TurnoDisponibleRepository;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.infra.errores.ApiResponseDTO;
import med.voll.api.infra.errores.ValidacionIntegridad;
import med.voll.api.domain.consulta.repository.IConsultaRepository;
import med.voll.api.domain.medico.repository.MedicoRepository;
import med.voll.api.domain.paciente.repository.IPacienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AgendaDeConsultaService {

    private final IConsultaRepository consultaRepo;
    private final MedicoRepository medicoRepo;
    private final IPacienteRepository pacienteRepo;
    private final TurnoDisponibleRepository turnoRepo;
    private final List<ValidadorDeConsultas> validadores;

    /* ============================================================
       1. AGENDAR CONSULTA
       ============================================================ */
    @Transactional
    public ApiResponseDTO agendarConsulta(DatosAgendarConsulta dto) {

        Paciente paciente = pacienteRepo.findById(dto.idPaciente())
                .orElseThrow(() -> new ValidacionIntegridad("Paciente no encontrado"));

        TurnoDisponible turno = turnoRepo.findById(dto.idTurno())
                .orElseThrow(() -> new ValidacionIntegridad("Turno no encontrado"));

        if (turno.getEstado() != EstadoTurno.DISPONIBLE) {
            throw new ValidacionIntegridad("El turno no está disponible");
        }

        // Construcción DTO para validadores
        DatosValidacionConsulta datosVal = new DatosValidacionConsulta(
                paciente.getId(),
                turno.getMedico().getId(),
                LocalDateTime.of(turno.getFecha(), turno.getHora())
        );

        validadores.forEach(v -> v.validar(datosVal));

        // Reservar turno
        turno.setEstado(EstadoTurno.RESERVADO);
        turnoRepo.save(turno);

        Consulta consulta = new Consulta(
                turno.getMedico(),
                paciente,
                turno,
                dto.motivoConsulta()
        );

        consultaRepo.save(consulta);

        return new ApiResponseDTO(
                true,
                "Consulta agendada correctamente",
                new DatosDetalleConsulta(consulta),
                HttpStatus.CREATED
        );
    }

    /* ============================================================
       2. CANCELAR CONSULTA
       ============================================================ */
    @Transactional
    public ApiResponseDTO cancelarConsulta(DatosCancelamientoConsulta dto) {

        Consulta consulta = consultaRepo.findById(dto.idConsulta())
                .orElseThrow(() -> new ValidacionIntegridad("Consulta no encontrada"));

        TurnoDisponible turno = consulta.getTurno();
        turno.setEstado(EstadoTurno.DISPONIBLE);
        turnoRepo.save(turno);

        consulta.cancelar(dto.motivo());

        return new ApiResponseDTO(
                true,
                "Consulta cancelada correctamente",
                Map.of("id", consulta.getId()),
                HttpStatus.OK
        );
    }

    /* ============================================================
       3. REPROGRAMAR CONSULTA
       ============================================================ */
    @Transactional
    public ApiResponseDTO reprogramarConsulta(DatosReprogramarConsulta dto) {

        Consulta consulta = consultaRepo.findById(dto.idConsulta())
                .orElseThrow(() -> new ValidacionIntegridad("Consulta no encontrada"));

        TurnoDisponible turnoViejo = consulta.getTurno();

        TurnoDisponible turnoNuevo = turnoRepo.findById(dto.idNuevoTurno())
                .orElseThrow(() -> new ValidacionIntegridad("Nuevo turno no encontrado"));

        if (turnoNuevo.getEstado() != EstadoTurno.DISPONIBLE) {
            throw new ValidacionIntegridad("El nuevo turno no está disponible");
        }

        // Validación del nuevo turno
        DatosValidacionConsulta datosVal = new DatosValidacionConsulta(
                consulta.getPaciente().getId(),
                turnoNuevo.getMedico().getId(),
                LocalDateTime.of(turnoNuevo.getFecha(), turnoNuevo.getHora())
        );

        validadores.forEach(v -> v.validar(datosVal));

        // liberar turno viejo
        turnoViejo.setEstado(EstadoTurno.DISPONIBLE);
        turnoRepo.save(turnoViejo);

        // reservar turno nuevo
        turnoNuevo.setEstado(EstadoTurno.RESERVADO);
        turnoRepo.save(turnoNuevo);

        consulta.reprogramar(turnoNuevo);

        return new ApiResponseDTO(
                true,
                "Consulta reprogramada correctamente",
                new DatosDetalleConsulta(consulta),
                HttpStatus.OK
        );
    }
}

