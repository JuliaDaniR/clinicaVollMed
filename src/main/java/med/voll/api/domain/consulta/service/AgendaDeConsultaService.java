package med.voll.api.domain.consulta.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import med.voll.api.domain.consulta.dto.DatosDetalleConsulta;
import med.voll.api.domain.consulta.model.Consulta;
import med.voll.api.domain.consulta.validaciones.DatosCancelamientoConsulta;
import med.voll.api.domain.consulta.validaciones.ValidadorCancelamientoDeConsulta;
import med.voll.api.domain.consulta.validaciones.ValidadorDeConsultas;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.infra.errores.ApiResponseDTO;
import med.voll.api.infra.errores.ValidacionIntegridad;
import med.voll.api.domain.consulta.repository.IConsultaRepository;
import med.voll.api.domain.medico.repository.MedicoRepository;
import med.voll.api.domain.paciente.repository.IPacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AgendaDeConsultaService {

    private final IConsultaRepository consultaRepo;
    private final MedicoRepository medicoRepo;
    private final IPacienteRepository pacienteRepo;
    private final List<ValidadorDeConsultas> validadores;
    private final List<ValidadorCancelamientoDeConsulta> validadoresCancelamiento;

    // ==========================================================
    // AGENDAR CONSULTA
    // ==========================================================
    @Transactional
    public ApiResponseDTO agendarConsulta(DatosAgendarConsulta dto) {

        Paciente paciente = pacienteRepo.findById(dto.idPaciente())
                .orElseThrow(() -> new ValidacionIntegridad("Paciente no encontrado"));

        if (dto.idMedico() != null && !medicoRepo.existsById(dto.idMedico())) {
            throw new ValidacionIntegridad("Médico no encontrado");
        }

        validadores.forEach(v -> v.validar(dto));

        Medico medico = seleccionarMedico(dto);

        if (medico == null) {
            throw new ValidacionIntegridad("No hay médicos disponibles para ese horario");
        }

        Consulta consulta = new Consulta(medico, paciente, dto.fecha());

        consultaRepo.save(consulta);

        return new ApiResponseDTO(
                true,
                "Consulta agendada correctamente",
                new DatosDetalleConsulta(consulta),
                HttpStatus.CREATED
        );
    }

    // ==========================================================
    // CANCELAR CONSULTA
    // ==========================================================
    @Transactional
    public ApiResponseDTO cancelarConsulta(DatosCancelamientoConsulta dto) {

        Consulta consulta = consultaRepo.findById(dto.idConsulta())
                .orElseThrow(() -> new ValidacionIntegridad("Consulta no encontrada"));

        validadoresCancelamiento.forEach(v -> v.validar(dto));

        consulta.cancelar(dto.motivo());

        return new ApiResponseDTO(
                true,
                "Consulta cancelada correctamente",
                Map.of("id", consulta.getId()),
                HttpStatus.OK
        );
    }

    // ==========================================================
    // ACTUALIZAR CONSULTA
    // ==========================================================
    @Transactional
    public ApiResponseDTO actualizarConsulta(DatosAgendarConsulta.DatosActualizarConsulta dto) {

        Consulta consulta = consultaRepo.findById(dto.id())
                .orElseThrow(() -> new ValidacionIntegridad("Consulta no encontrada"));

        Medico medico = medicoRepo.findById(dto.idMedico())
                .orElse(consulta.getMedico());

        Paciente paciente = pacienteRepo.findById(dto.idPaciente())
                .orElse(consulta.getPaciente());

        consulta.actualizar(dto, medico, paciente);

        return new ApiResponseDTO(
                true,
                "Consulta actualizada correctamente",
                new DatosDetalleConsulta(consulta),
                HttpStatus.OK
        );
    }

    // ==========================================================
    // MÉTODO PRIVADO
    // ==========================================================
    private Medico seleccionarMedico(DatosAgendarConsulta dto) {

        if (dto.idMedico() != null) {
            return medicoRepo.getReferenceById(dto.idMedico());
        }

        if (dto.especialidad() == null) {
            throw new ValidacionIntegridad("Debe especificar una especialidad");
        }

        return medicoRepo.seleccionarMedicoPorEspecialidadEnFecha(dto.especialidad(), dto.fecha());
    }
}
