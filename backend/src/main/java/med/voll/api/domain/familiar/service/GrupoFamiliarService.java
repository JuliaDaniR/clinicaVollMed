package med.voll.api.domain.familiar.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.familiar.dto.DatosFamiliarDTO;
import med.voll.api.domain.familiar.dto.DatosRegistrarDependienteDTO;
import med.voll.api.domain.familiar.model.GrupoFamiliar;
import med.voll.api.domain.familiar.repository.IGrupoFamiliarRepository;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.paciente.repository.IPacienteRepository;
import med.voll.api.domain.historial.domain.HistoriaClinica;
import med.voll.api.domain.historial.repository.HistoriaClinicaRepository;
import med.voll.api.domain.usuarios.model.Rol;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.infra.errores.ApiResponseDTO;
import med.voll.api.infra.errores.ValidacionIntegridad;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GrupoFamiliarService {

    private final IGrupoFamiliarRepository grupoFamiliarRepo;
    private final IPacienteRepository pacienteRepo;
    private final HistoriaClinicaRepository historiaClinicaRepo;

    @Transactional
    public ApiResponseDTO registrarDependiente(Long titularId, DatosRegistrarDependienteDTO dto, Usuario auth) {
        // 1. Validar que exista el titular
        Paciente titular = pacienteRepo.findById(titularId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente titular no encontrado"));

        // 2. Validar permisos: ADMIN, RECEPCIONISTA, o el propio titular
        validarPermisoAcceso(titular, auth);

        // 3. Crear y guardar el Paciente dependiente (sin usuario)
        Paciente dependiente = new Paciente(dto);
        pacienteRepo.save(dependiente);

        // 4. Vincular en GrupoFamiliar
        GrupoFamiliar gf = new GrupoFamiliar(titular, dependiente, dto.parentesco());
        grupoFamiliarRepo.save(gf);

        // 5. Crear Historia Clínica para el dependiente
        HistoriaClinica hc = new HistoriaClinica();
        hc.setPaciente(dependiente);
        hc.setFechaCreacion(LocalDate.now());
        historiaClinicaRepo.save(hc);

        return new ApiResponseDTO(
                true,
                "Miembro familiar registrado correctamente",
                new DatosFamiliarDTO(
                        dependiente.getId(),
                        dependiente.getNombre(),
                        dependiente.getDni(),
                        dependiente.getFechaNacimiento(),
                        gf.getParentesco(),
                        dependiente.getActivo()
                ),
                HttpStatus.CREATED
        );
    }

    @Transactional(readOnly = true)
    public ApiResponseDTO listarFamilia(Long titularId, Usuario auth) {
        Paciente titular = pacienteRepo.findById(titularId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente titular no encontrado"));

        validarPermisoAcceso(titular, auth);

        List<DatosFamiliarDTO> familia = grupoFamiliarRepo.findByPacienteTitularIdAndActivoTrue(titularId)
                .stream()
                .map(gf -> new DatosFamiliarDTO(
                        gf.getPacienteDependiente().getId(),
                        gf.getPacienteDependiente().getNombre(),
                        gf.getPacienteDependiente().getDni(),
                        gf.getPacienteDependiente().getFechaNacimiento(),
                        gf.getParentesco(),
                        gf.getPacienteDependiente().getActivo()
                ))
                .toList();

        return new ApiResponseDTO(
                true,
                "Familia listada correctamente",
                familia,
                HttpStatus.OK
        );
    }

    @Transactional
    public ApiResponseDTO desvincular(Long titularId, Long dependienteId, Usuario auth) {
        Paciente titular = pacienteRepo.findById(titularId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente titular no encontrado"));

        validarPermisoAcceso(titular, auth);

        GrupoFamiliar gf = grupoFamiliarRepo.findByPacienteDependienteIdAndPacienteTitularId(dependienteId, titularId)
                .orElseThrow(() -> new EntityNotFoundException("Vínculo familiar no encontrado"));

        gf.setActivo(false);
        grupoFamiliarRepo.save(gf);

        Paciente dependiente = gf.getPacienteDependiente();
        dependiente.desactivar(auth.getEmail());
        pacienteRepo.save(dependiente);

        return new ApiResponseDTO(
                true,
                "Miembro familiar desvinculado correctamente",
                null,
                HttpStatus.NO_CONTENT
        );
    }

    private void validarPermisoAcceso(Paciente titular, Usuario auth) {
        boolean esAdmin = auth.tieneRol(Rol.NombreRol.ROLE_ADMIN);
        boolean esRecep = auth.tieneRol(Rol.NombreRol.ROLE_RECEPCIONISTA);
        boolean esElMismo = titular.getUsuario() != null && titular.getUsuario().getId().equals(auth.getId());

        if (!(esAdmin || esRecep || esElMismo)) {
            throw new ValidacionIntegridad("No tienes permisos para gestionar la familia de este paciente");
        }
    }
}
