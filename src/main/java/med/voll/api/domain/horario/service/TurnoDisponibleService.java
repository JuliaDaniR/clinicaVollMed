package med.voll.api.domain.horario.service;

import lombok.RequiredArgsConstructor;
import med.voll.api.domain.horario.dto.TurnoAccionDTO;
import med.voll.api.domain.horario.dto.TurnoDisponibleDTO;
import med.voll.api.domain.horario.model.ConfiguracionHorariaMedico;
import med.voll.api.domain.horario.repository.ConfiguracionHorariaMedicoRepository;
import med.voll.api.domain.horario.model.TurnoDisponible;
import med.voll.api.domain.horario.model.enumerator.EstadoTurno;
import med.voll.api.domain.horario.repository.TurnoDisponibleRepository;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.medico.repository.MedicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TurnoDisponibleService {

    private final TurnoDisponibleRepository turnoRepo;
    private final MedicoRepository medicoRepo;
    private final ConfiguracionHorariaMedicoRepository configRepo;
    private final AgendaGeneratorService agendaGenerator;

    /* ============================================================
       1. LISTAR TURNOS DISPONIBLES POR MÉDICO
       ============================================================ */
    public List<TurnoDisponibleDTO> listarDisponibles(Long medicoId) {
        Medico medico = medicoRepo.findById(medicoId)
                .orElseThrow(() -> new IllegalArgumentException("Médico no encontrado"));

        return turnoRepo.findDisponiblesFuturos(medico, LocalDate.now())
                .stream()
                .map(t -> new TurnoDisponibleDTO(
                        t.getId(),
                        t.getFecha(),
                        t.getHora(),
                        t.getEstado(),
                        medico.getId(),
                        medico.getUsuario().getNombre()
                ))
                .toList();
    }

    /* ============================================================
       2. RESERVAR UN TURNO (cita médica)
       ============================================================ */
    public TurnoAccionDTO reservar(Long turnoId) {
        TurnoDisponible turno = obtenerTurnoDisponible(turnoId);
        turno.setEstado(EstadoTurno.RESERVADO);
        turnoRepo.save(turno);

        return new TurnoAccionDTO(
                turno.getId(),
                turno.getFecha(),
                turno.getHora(),
                turno.getEstado().name()
        );
    }

    /* ============================================================
       3. CANCELAR UNA RESERVA → vuelve a disponible
       ============================================================ */
    public TurnoAccionDTO cancelar(Long turnoId) {
        TurnoDisponible turno = obtenerTurno(turnoId);
        turno.setEstado(EstadoTurno.DISPONIBLE);
        turnoRepo.save(turno);

        return new TurnoAccionDTO(
                turno.getId(),
                turno.getFecha(),
                turno.getHora(),
                turno.getEstado().name()
        );
    }

    private TurnoDisponible obtenerTurno(Long turnoId) {
        return turnoRepo.findById(turnoId)
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado"));
    }

    private TurnoDisponible obtenerTurnoDisponible(Long turnoId) {

        TurnoDisponible turno = obtenerTurno(turnoId);

        if (turno.getEstado() != EstadoTurno.DISPONIBLE) {
            throw new IllegalStateException("El turno no está disponible");
        }

        return turno;
    }

    /* ============================================================
       4. BLOQUEAR RANGO (vacaciones / licencia médica)
       ============================================================ */
    @Transactional
    public int bloquearRango(Long medicoId, LocalDate desde, LocalDate hasta) {

        List<TurnoDisponible> turnos = turnoRepo.findByMedicoIdAndFechaBetween(
                medicoId, desde, hasta
        );

        int count = 0;

        for (TurnoDisponible t : turnos) {

            // No tocamos turnos reservados
            if (t.getEstado() == EstadoTurno.DISPONIBLE) {
                t.setEstado(EstadoTurno.BLOQUEADO);
                count++;
            }
        }

        turnoRepo.saveAll(turnos);

        return count;
    }

    @Transactional
    public void desbloquearRango(Long medicoId, LocalDate desde, LocalDate hasta) {

        Medico medico = medicoRepo.findById(medicoId)
                .orElseThrow(() -> new IllegalArgumentException("Médico no encontrado"));

        List<TurnoDisponible> turnos = turnoRepo.findByMedicoIdAndFechaBetween(medico.getId(), desde, hasta);

        turnos.stream()
                .filter(t -> t.getEstado() == EstadoTurno.BLOQUEADO)
                .forEach(t -> t.setEstado(EstadoTurno.DISPONIBLE));

        turnoRepo.saveAll(turnos);
    }

    /* ============================================================
       5. REGENERAR TURNOS TRAS CAMBIAR LA CONFIGURACIÓN
       ============================================================ */
    @Transactional
    public int regenerarPorConfiguracion(Long configId) {

        ConfiguracionHorariaMedico config = configRepo.findById(configId)
                .orElseThrow(() -> new RuntimeException("Configuración no encontrada"));

        // Borrar solo turnos disponibles futuros
        turnoRepo.deleteFutureDisponiblesByMedico(config.getMedico().getId());

        // Regenerar profesionalmente (3 meses)
        return agendaGenerator.regenerarDesdeHoy(config);
    }
}
