package med.voll.api.domain.horario.repository;

import med.voll.api.domain.horario.model.ConfiguracionHorariaMedico;
import med.voll.api.domain.medico.model.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfiguracionHorariaMedicoRepository extends JpaRepository<ConfiguracionHorariaMedico, Long> {
    Optional<Object> findByMedicoAndActivoTrue(Medico medico);

    List<ConfiguracionHorariaMedico> findByMedico(Medico medico);
}
