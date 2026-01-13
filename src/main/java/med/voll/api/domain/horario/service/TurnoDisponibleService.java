package med.voll.api.domain.horario.service;

import lombok.RequiredArgsConstructor;
import med.voll.api.domain.horario.model.ConfiguracionHorariaMedico;
import med.voll.api.domain.horario.repository.ConfiguracionHorariaMedicoRepository;
import med.voll.api.domain.horario.model.TurnoDisponible;
import med.voll.api.domain.horario.model.enumerator.EstadoTurno;
import med.voll.api.domain.horario.repository.TurnoDisponibleRepository;
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
    public List<TurnoDisponible> listarDisponibles(Long medicoId) {
        return turnoRepo.findByMedicoIdAndEstadoOrderByFechaAscHoraAsc(
                medicoId, EstadoTurno.DISPONIBLE
        );
    }

    /* ============================================================
       2. RESERVAR UN TURNO (cita médica)
       ============================================================ */
    @Transactional
    public TurnoDisponible reservar(Long turnoId) {

        TurnoDisponible turno = turnoRepo.findById(turnoId)
                .orElseThrow(() -> new RuntimeException("Turno no encontrado"));

        if (turno.getEstado() != EstadoTurno.DISPONIBLE) {
            throw new RuntimeException("El turno no está disponible");
        }

        turno.setEstado(EstadoTurno.RESERVADO);
        return turnoRepo.save(turno);
    }

    /* ============================================================
       3. CANCELAR UNA RESERVA → vuelve a disponible
       ============================================================ */
    @Transactional
    public TurnoDisponible cancelar(Long turnoId) {

        TurnoDisponible turno = turnoRepo.findById(turnoId)
                .orElseThrow(() -> new RuntimeException("Turno no encontrado"));

        if (turno.getEstado() != EstadoTurno.RESERVADO) {
            throw new RuntimeException("Solo se pueden cancelar turnos reservados");
        }

        turno.setEstado(EstadoTurno.DISPONIBLE);
        return turnoRepo.save(turno);
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
