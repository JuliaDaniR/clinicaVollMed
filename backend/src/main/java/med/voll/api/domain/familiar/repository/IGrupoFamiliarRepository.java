package med.voll.api.domain.familiar.repository;

import med.voll.api.domain.familiar.model.GrupoFamiliar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IGrupoFamiliarRepository extends JpaRepository<GrupoFamiliar, Long> {
    List<GrupoFamiliar> findByPacienteTitularIdAndActivoTrue(Long titularId);
    Optional<GrupoFamiliar> findByPacienteDependienteId(Long dependienteId);
    Optional<GrupoFamiliar> findByPacienteDependienteIdAndPacienteTitularId(Long depId, Long titId);
}
