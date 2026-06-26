package med.voll.api.domain.recetas.repository;

import med.voll.api.domain.recetas.domain.RecetaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecetaMedicaRepository extends JpaRepository<RecetaMedica, Long> {
}
