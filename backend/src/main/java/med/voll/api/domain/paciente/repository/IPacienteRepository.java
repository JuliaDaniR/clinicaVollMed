package med.voll.api.domain.paciente.repository;

import med.voll.api.domain.paciente.model.Paciente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IPacienteRepository extends JpaRepository<Paciente, Long> {
    Page<Paciente> findAllByActivoTrue(Pageable paginacion);

    @Query("""
        SELECT p FROM Paciente p
        LEFT JOIN p.usuario u
        WHERE u.email = :email
           OR p.id IN (
               SELECT gf.pacienteDependiente.id FROM GrupoFamiliar gf
               LEFT JOIN gf.pacienteTitular pt
               LEFT JOIN pt.usuario tu
               WHERE tu.email = :email
                 AND gf.activo = true
           )
    """)
    Page<Paciente> findAllByUsuarioEmail(String email, Pageable pageable);

    @Query("""
            select p.activo
            from Paciente p
            where p.id=:idPaciente
            """)
    Boolean findActivoById(Long idPaciente);
}