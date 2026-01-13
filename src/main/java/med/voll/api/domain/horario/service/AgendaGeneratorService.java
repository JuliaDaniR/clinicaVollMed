package med.voll.api.domain.horario.service;

import lombok.RequiredArgsConstructor;
import med.voll.api.domain.horario.model.ConfiguracionHorariaMedico;
import med.voll.api.domain.horario.model.DiaHorarioMedico;
import med.voll.api.domain.horario.model.TurnoDisponible;
import med.voll.api.domain.horario.model.enumerator.DiaSemana;
import med.voll.api.domain.horario.model.enumerator.EstadoTurno;
import med.voll.api.domain.horario.repository.TurnoDisponibleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgendaGeneratorService {

    private final TurnoDisponibleRepository turnoRepo;

    /* ============================================================
       1. GENERAR AGENDA COMPLETA
       ============================================================ */
    @Transactional
    public int generarAgendaCompleta(ConfiguracionHorariaMedico config,
                                     LocalDate inicio,
                                     LocalDate fin) {

        int total = 0;
        LocalDate fecha = inicio;

        while (!fecha.isAfter(fin)) {

            DiaSemana diaSemana = DiaSemana.desde(fecha.getDayOfWeek());

            List<DiaHorarioMedico> bloques = config.getDias()
                    .stream()
                    .filter(b -> b.getDia() == diaSemana)
                    .toList();

            if (!bloques.isEmpty()) {
                total += generarTurnosParaDia(config, fecha, bloques);
            }

            fecha = fecha.plusDays(1);
        }

        return total;
    }

    /* ============================================================
       2. GENERAR TURNOS PARA UN DÍA ESPECÍFICO
       ============================================================ */
    @Transactional
    public int generarTurnosParaDia(ConfiguracionHorariaMedico config,
                                    LocalDate fecha,
                                    List<DiaHorarioMedico> bloques) {

        int generados = 0;
        int duracion = config.getDuracionTurno();

        for (DiaHorarioMedico bloque : bloques) {

            LocalTime hora = bloque.getHoraInicio();

            while (!hora.plusMinutes(duracion).isAfter(bloque.getHoraFin())) {

                boolean existe = turnoRepo.existsByMedicoAndFechaAndHora(
                        config.getMedico(), fecha, hora
                );

                if (!existe) {
                    TurnoDisponible turno = new TurnoDisponible();
                    turno.setFecha(fecha);
                    turno.setHora(hora);
                    turno.setMedico(config.getMedico());
                    turno.setEstado(EstadoTurno.DISPONIBLE);

                    turnoRepo.save(turno);
                    generados++;
                }

                hora = hora.plusMinutes(duracion);
            }
        }

        return generados;
    }

    /* ============================================================
       3. REGENERAR DESDE HOY (CASO TÍPICO AL EDITAR CONFIGURACIÓN)
       ============================================================ */
    @Transactional
    public int regenerarDesdeHoy(ConfiguracionHorariaMedico config) {

        LocalDate hoy = LocalDate.now();

        // Borrar SOLO turnos futuros y NO reservados
        turnoRepo.deleteFutureDisponiblesByMedico(config.getMedico().getId());

        // Regenerar 3 meses hacia adelante (estándar en la industria)
        return generarAgendaCompleta(config, hoy, hoy.plusMonths(3));
    }

    /* ============================================================
       4. REGENERAR SOLO UN DÍA — útil para reprogramación manual
       ============================================================ */
    @Transactional
    public int regenerarDia(ConfiguracionHorariaMedico config, LocalDate fecha) {

        List<DiaHorarioMedico> bloques = config.getDias().stream()
                .filter(b -> b.getDia() == DiaSemana.desde(fecha.getDayOfWeek()))
                .toList();

        turnoRepo.deleteByMedicoAndFechaAfter(config.getMedico(), fecha.minusDays(1));

        return generarTurnosParaDia(config, fecha, bloques);
    }
}
