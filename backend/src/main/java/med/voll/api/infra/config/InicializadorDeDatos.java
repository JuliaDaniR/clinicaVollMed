package med.voll.api.infra.config;

import med.voll.api.domain.usuarios.model.Rol;
import med.voll.api.domain.usuarios.repository.IRolRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InicializadorDeDatos {

    @Bean
    CommandLineRunner initRoles(IRolRepository rolRepository) {
        return args -> {
            if (rolRepository.count() == 0) {
                rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_ADMIN));
                rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_RECEPCIONISTA));
                rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_MEDICO));
            }
        };
    }
}