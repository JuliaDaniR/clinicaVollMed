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
import med.voll.api.domain.consulta.dto.DatosListadoConsultaDTO;
import med.voll.api.domain.consulta.dto.DatosPropuestaReprogramacionDTO;
import med.voll.api.domain.consulta.model.enumerator.MotivoCancelamiento;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.usuarios.model.Rol;
import med.voll.api.domain.usuarios.model.Usuario;
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

    /* ============================================================
       4. LISTAR CONSULTAS
       ============================================================ */
    public List<DatosListadoConsultaDTO> listarConsultas(Usuario auth) {
        List<Consulta> consultas;

        if (auth.tieneRol(Rol.NombreRol.ROLE_ADMIN) || auth.tieneRol(Rol.NombreRol.ROLE_RECEPCIONISTA)) {
            consultas = consultaRepo.findAllByOrderByFechaAsc();
        } else if (auth.tieneRol(Rol.NombreRol.ROLE_MEDICO)) {
            consultas = consultaRepo.findByMedicoUsuarioEmailOrderByFechaAsc(auth.getEmail());
        } else if (auth.tieneRol(Rol.NombreRol.ROLE_PACIENTE)) {
            consultas = consultaRepo.findAllByTitularEmailIncluyendoFamilia(auth.getEmail());
        } else {
            consultas = List.of();
        }

        return consultas.stream().map(DatosListadoConsultaDTO::new).toList();
    }

    /* ============================================================
       5. PROPONER REPROGRAMACION
       ============================================================ */
    @Transactional
    public ApiResponseDTO proponerReprogramacion(Long id, DatosPropuestaReprogramacionDTO dto) {
        Consulta consulta = consultaRepo.findById(id)
                .orElseThrow(() -> new ValidacionIntegridad("Consulta no encontrada"));

        if (dto.fechaPropuesta().isBefore(LocalDateTime.now())) {
            throw new ValidacionIntegridad("La fecha propuesta debe ser futura");
        }

        consulta.proponerReprogramacion(dto.fechaPropuesta());
        consultaRepo.save(consulta);

        return new ApiResponseDTO(
                true,
                "Propuesta de reprogramación enviada correctamente",
                new DatosListadoConsultaDTO(consulta),
                HttpStatus.OK
        );
    }

    /* ============================================================
       6. ACEPTAR REPROGRAMACION
       ============================================================ */
    @Transactional
    public ApiResponseDTO aceptarReprogramacion(Long id) {
        Consulta consulta = consultaRepo.findById(id)
                .orElseThrow(() -> new ValidacionIntegridad("Consulta no encontrada"));

        if (!consulta.getReprogramadaPendiente() || consulta.getFechaPropuesta() == null) {
            throw new ValidacionIntegridad("No hay ninguna propuesta de reprogramación pendiente para esta consulta");
        }

        LocalDateTime propuesta = consulta.getFechaPropuesta();
        Medico medico = consulta.getMedico();

        // Buscar o crear TurnoDisponible
        TurnoDisponible nuevoTurno = turnoRepo.findByMedicoIdAndFechaAndHora(
                medico.getId(),
                propuesta.toLocalDate(),
                propuesta.toLocalTime()
        ).orElseGet(() -> {
            TurnoDisponible t = new TurnoDisponible();
            t.setMedico(medico);
            t.setFecha(propuesta.toLocalDate());
            t.setHora(propuesta.toLocalTime());
            t.setEstado(EstadoTurno.RESERVADO);
            return turnoRepo.save(t);
        });

        // Validar que el nuevo turno esté disponible (o que sea el que acabamos de crear / o ya reservado)
        if (nuevoTurno.getId() != null && nuevoTurno.getEstado() != EstadoTurno.DISPONIBLE && nuevoTurno.getEstado() != EstadoTurno.RESERVADO) {
            throw new ValidacionIntegridad("El horario propuesto ya no está disponible");
        }

        // Si ya existía el turno y estaba disponible, lo reservamos
        if (nuevoTurno.getEstado() == EstadoTurno.DISPONIBLE) {
            nuevoTurno.setEstado(EstadoTurno.RESERVADO);
            turnoRepo.save(nuevoTurno);
        }

        // Liberar el turno viejo
        TurnoDisponible turnoViejo = consulta.getTurno();
        if (turnoViejo != null) {
            turnoViejo.setEstado(EstadoTurno.DISPONIBLE);
            turnoRepo.save(turnoViejo);
        }

        // Aceptar la reprogramación en la consulta
        consulta.aceptarReprogramacion(nuevoTurno);
        consultaRepo.save(consulta);

        return new ApiResponseDTO(
                true,
                "Reprogramación aceptada correctamente",
                new DatosListadoConsultaDTO(consulta),
                HttpStatus.OK
        );
    }

    /* ============================================================
       7. RECHAZAR REPROGRAMACION Y MANTENER ORIGINAL
       ============================================================ */
    @Transactional
    public ApiResponseDTO rechazarReprogramacionMantener(Long id) {
        Consulta consulta = consultaRepo.findById(id)
                .orElseThrow(() -> new ValidacionIntegridad("Consulta no encontrada"));

        consulta.rechazarReprogramacionMantener();
        consultaRepo.save(consulta);

        return new ApiResponseDTO(
                true,
                "Propuesta de reprogramación rechazada. Se mantiene el horario original.",
                new DatosListadoConsultaDTO(consulta),
                HttpStatus.OK
        );
    }

    /* ============================================================
       8. RECHAZAR REPROGRAMACION Y CANCELAR CITA
       ============================================================ */
    @Transactional
    public ApiResponseDTO rechazarReprogramacionCancelar(Long id) {
        Consulta consulta = consultaRepo.findById(id)
                .orElseThrow(() -> new ValidacionIntegridad("Consulta no encontrada"));

        // Liberar el turno viejo
        TurnoDisponible turno = consulta.getTurno();
        if (turno != null) {
            turno.setEstado(EstadoTurno.DISPONIBLE);
            turnoRepo.save(turno);
        }

        // Cancelar consulta con motivo especial
        consulta.cancelar(MotivoCancelamiento.PACIENTE_RECHAZO_REPROGRAMACION);
        // También limpiar campos de reprogramación
        consulta.rechazarReprogramacionMantener();
        consultaRepo.save(consulta);

        return new ApiResponseDTO(
                true,
                "Propuesta de reprogramación rechazada y consulta cancelada.",
                Map.of("id", consulta.getId()),
                HttpStatus.OK
        );
    }
}

