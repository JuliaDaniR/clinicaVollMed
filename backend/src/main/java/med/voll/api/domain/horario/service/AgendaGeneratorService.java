package med.voll.api.domain.horario.service;

import lombok.RequiredArgsConstructor;
import med.voll.api.domain.horario.model.ConfiguracionHorariaMedico;
import med.voll.api.domain.horario.model.DiaHorarioMedico;
import med.voll.api.domain.horario.model.TurnoDisponible;
import med.voll.api.domain.horario.model.enumerator.DiaSemana;
import med.voll.api.domain.horario.model.enumerator.EstadoTurno;
import med.voll.api.domain.horario.repository.ConfiguracionHorariaMedicoRepository;
import med.voll.api.domain.horario.repository.TurnoDisponibleRepository;
import med.voll.api.domain.medico.model.Medico;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgendaGeneratorService {

    private final TurnoDisponibleRepository turnoRepo;
    private final ConfiguracionHorariaMedicoRepository configRepo;

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
    public int regenerarDesdeHoy(Medico medico) {

        LocalDate hoy = LocalDate.now();

        // Borrar SOLO turnos futuros y NO reservados
        turnoRepo.deleteFutureDisponiblesByMedico(medico.getId());

        // Buscar todas las configuraciones activas del médico
        List<ConfiguracionHorariaMedico> activas = configRepo.findByMedicoAndActivoTrue(medico);

        int total = 0;
        for (ConfiguracionHorariaMedico config : activas) {
            // Generar 3 meses hacia adelante (estándar en la industria)
            total += generarAgendaCompleta(config, hoy, hoy.plusMonths(3));
        }

        return total;
    }

    /* ============================================================
       4. REGENERAR SOLO UN DÍA — útil para reprogramación manual
       ============================================================ */
    @Transactional
    public int regenerarDia(Medico medico, LocalDate fecha) {

        // Borrar los turnos disponibles de ese día
        turnoRepo.deleteByMedicoAndFechaBetweenAndEstado(
                medico,
                fecha,
                fecha,
                EstadoTurno.DISPONIBLE
        );

        // Buscar todas las configuraciones activas del médico
        List<ConfiguracionHorariaMedico> activas = configRepo.findByMedicoAndActivoTrue(medico);

        int total = 0;
        for (ConfiguracionHorariaMedico config : activas) {
            List<DiaHorarioMedico> bloques = config.getDias().stream()
                    .filter(b -> b.getDia() == DiaSemana.desde(fecha.getDayOfWeek()))
                    .toList();

            if (!bloques.isEmpty()) {
                total += generarTurnosParaDia(config, fecha, bloques);
            }
        }

        return total;
    }

    /* ============================================================
       5. REGENERAR UN RANGO DE FECHAS
       ============================================================ */
    @Transactional
    public int regenerarRango(Medico medico,
                              LocalDate inicio,
                              LocalDate fin) {

        // 1. Borrar turnos disponibles dentro del rango
        turnoRepo.deleteByMedicoAndFechaBetweenAndEstado(
                medico,
                inicio,
                fin,
                EstadoTurno.DISPONIBLE
        );

        // Buscar todas las configuraciones activas del médico
        List<ConfiguracionHorariaMedico> activas = configRepo.findByMedicoAndActivoTrue(medico);

        // 2. Regenerar turnos en ese rango para todas las configuraciones activas
        int total = 0;
        for (ConfiguracionHorariaMedico config : activas) {
            total += generarAgendaCompleta(config, inicio, fin);
        }

        return total;
    }

    public int contarTurnosGenerados(Medico medico) {
        LocalDate hoy = LocalDate.now();
        LocalDate fin = hoy.plusMonths(3);

        return turnoRepo.countByMedicoAndFechaBetween(medico, hoy, fin);
    }
}
