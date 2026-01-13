package med.voll.api.domain.horario.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.horario.model.ConfiguracionHorariaMedico;
import med.voll.api.domain.horario.model.DiaHorarioMedico;
import med.voll.api.domain.horario.model.enumerator.DiaSemana;
import med.voll.api.domain.horario.repository.ConfiguracionHorariaMedicoRepository;
import med.voll.api.domain.horario.dto.ConfiguracionHorariaDTO;
import med.voll.api.domain.horario.dto.DiaHorarioDTO;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.medico.repository.MedicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConfiguracionHorariaMedicoService {

    private final ConfiguracionHorariaMedicoRepository configuracionRepo;
    private final MedicoRepository medicoRepo;
    private final AgendaGeneratorService agendaGeneratorService;

    /* ============================================================
       1. CREAR CONFIGURACIÓN
       ============================================================ */
    @Transactional
    public ConfiguracionHorariaMedico crearConfiguracion(ConfiguracionHorariaDTO dto) {

        Medico medico = medicoRepo.findById(dto.medicoId())
                .orElseThrow(() -> new IllegalArgumentException("Médico no encontrado"));

        configuracionRepo.findByMedicoAndActivaTrue(medico)
                .ifPresent(c -> { throw new IllegalStateException("El médico ya tiene una configuración activa"); });

        validarBloques(dto.dias());

        ConfiguracionHorariaMedico config = new ConfiguracionHorariaMedico();
        config.setMedico(medico);
        config.setActiva(true);
        config.setDuracionMinutosPersonalizada(dto.duracionPersonalizada());

        List<DiaHorarioMedico> bloques = dto.dias().stream()
                .map(d -> new DiaHorarioMedico(
                        null, d.dia(), d.horaInicio(), d.horaFin(), config
                ))
                .toList();

        config.setDias(bloques);

        configuracionRepo.save(config);

        // 🔥 Generamos turnos desde mañana hasta 3 meses
        agendaGeneratorService.regenerarDesdeHoy(config);

        return config;
    }

    /* ============================================================
       2. ACTUALIZAR CONFIGURACIÓN
       ============================================================ */
    @Transactional
    public ConfiguracionHorariaMedico actualizarConfiguracion(Long configId, ConfiguracionHorariaDTO dto) {

        ConfiguracionHorariaMedico config = configuracionRepo.findById(configId)
                .orElseThrow(() -> new IllegalArgumentException("Configuración no encontrada"));

        validarBloques(dto.dias());

        config.getDias().clear();

        List<DiaHorarioMedico> nuevos = dto.dias().stream()
                .map(d -> new DiaHorarioMedico(
                        null, d.dia(), d.horaInicio(), d.horaFin(), config
                ))
                .toList();

        config.setDuracionMinutosPersonalizada(dto.duracionPersonalizada());
        config.getDias().addAll(nuevos);

        configuracionRepo.save(config);

        // 🔥 Borramos futuros y regeneramos
        agendaGeneratorService.regenerarDesdeHoy(config);

        return config;
    }

    /* ============================================================
       3. DESACTIVAR CONFIGURACIÓN
       ============================================================ */
    @Transactional
    public void desactivarConfiguracion(Long id) {

        ConfiguracionHorariaMedico config = configuracionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Config no encontrada"));

        config.setActiva(false);
        configuracionRepo.save(config);
    }

    /* ============================================================
       4. LISTAR CONFIGURACIONES
       ============================================================ */
    public List<ConfiguracionHorariaMedico> listarPorMedico(Long medicoId) {
        Medico medico = medicoRepo.findById(medicoId)
                .orElseThrow(() -> new IllegalArgumentException("Médico no encontrado"));

        return configuracionRepo.findByMedico(medico);
    }

    /* ============================================================
       VALIDACIONES
       ============================================================ */
    private void validarBloques(List<DiaHorarioDTO> dias) {

        for (DiaHorarioDTO d : dias) {
            if (d.horaInicio().isAfter(d.horaFin())) {
                throw new IllegalArgumentException("La hora de inicio no puede superar la hora de fin");
            }
        }

        Map<DiaSemana, List<DiaHorarioDTO>> porDia =
                dias.stream().collect(Collectors.groupingBy(DiaHorarioDTO::dia));

        for (var entry : porDia.entrySet()) {

            List<DiaHorarioDTO> bloques = entry.getValue();
            bloques.sort(Comparator.comparing(DiaHorarioDTO::horaInicio));

            for (int i = 0; i < bloques.size() - 1; i++) {

                var actual = bloques.get(i);
                var siguiente = bloques.get(i + 1);

                if (actual.horaFin().isAfter(siguiente.horaInicio())) {
                    throw new IllegalArgumentException(
                            "Solapamiento en " + entry.getKey()
                                    + ": " + actual.horaInicio() + " - " + actual.horaFin()
                                    + " con " + siguiente.horaInicio() + " - " + siguiente.horaFin()
                    );
                }
            }
        }
    }

    public ConfiguracionHorariaMedico obtenerPorId(Long id) {
        ConfiguracionHorariaMedico config = configuracionRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Configuración horaria no encontrada"));

        if (!config.getActiva()) {
            throw new EntityNotFoundException("La configuración está desactivada");
        }

        return config;
    }
}
