package med.voll.api.infra.config;

import med.voll.api.domain.direccion.Direccion;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.medico.model.enumerator.Especialidad;
import med.voll.api.domain.medico.repository.MedicoRepository;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.paciente.repository.IPacienteRepository;
import med.voll.api.domain.usuarios.model.Rol;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.domain.usuarios.repository.IRolRepository;
import med.voll.api.domain.usuarios.repository.IUsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Set;

@Configuration
public class InicializadorDeDatos {

    @Value("${ADMIN_EMAIL:admin@vollmed.com}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:admin123}")
    private String adminPassword;

    @Bean
    CommandLineRunner initRolesAndAdmin(
            IRolRepository rolRepository,
            IUsuarioRepository usuarioRepository,
            MedicoRepository medicoRepository,
            IPacienteRepository pacienteRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Inicializar roles si están vacíos
            if (rolRepository.count() == 0) {
                rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_ADMIN));
                rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_RECEPCIONISTA));
                rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_MEDICO));
                rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_PACIENTE));
            }

            // Crear el administrador si no existe por email
            if (!usuarioRepository.existsByEmail(adminEmail)) {
                Rol adminRol = rolRepository.findByNombre(Rol.NombreRol.ROLE_ADMIN)
                        .orElseGet(() -> rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_ADMIN)));

                Usuario admin = new Usuario();
                admin.setEmail(adminEmail);
                admin.setClave(passwordEncoder.encode(adminPassword));
                admin.setActivo(true);
                admin.setRoles(Set.of(adminRol));

                usuarioRepository.save(admin);
                System.out.println("Admin user initialized successfully: " + adminEmail);
            }

            // Crear el recepcionista de prueba si no existe
            String recepcionistaEmail = "recepcionista@vollmed.com";
            if (!usuarioRepository.existsByEmail(recepcionistaEmail)) {
                Rol recepRol = rolRepository.findByNombre(Rol.NombreRol.ROLE_RECEPCIONISTA)
                        .orElseGet(() -> rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_RECEPCIONISTA)));

                Usuario recep = new Usuario();
                recep.setEmail(recepcionistaEmail);
                recep.setClave(passwordEncoder.encode("recepcionista123"));
                recep.setDni("11111111");
                recep.setActivo(true);
                recep.setRoles(Set.of(recepRol));

                usuarioRepository.save(recep);
                System.out.println("Recepcionista user initialized successfully: " + recepcionistaEmail);
            }

            // Crear el médico de prueba si no existe
            String medicoEmail = "medico@vollmed.com";
            if (!usuarioRepository.existsByEmail(medicoEmail)) {
                Rol medicoRol = rolRepository.findByNombre(Rol.NombreRol.ROLE_MEDICO)
                        .orElseGet(() -> rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_MEDICO)));

                Usuario usuarioMedico = new Usuario();
                usuarioMedico.setEmail(medicoEmail);
                usuarioMedico.setClave(passwordEncoder.encode("medico123"));
                usuarioMedico.setDni("22222222");
                usuarioMedico.setActivo(true);
                usuarioMedico.setRoles(Set.of(medicoRol));

                usuarioMedico = usuarioRepository.save(usuarioMedico);

                // Crear entidad Medico correspondiente
                Medico medico = new Medico();
                medico.setUsuario(usuarioMedico);
                medico.setNombre("Dr. Alberto de Prueba");
                medico.setTelefono("555-1234");
                medico.setMatricula("MAT-12345");
                medico.setEspecialidad(Especialidad.CARDIOLOGIA);
                medico.setActivo(true);
                medico.setDireccion(new Direccion("Calle Falsa", "Ciudad de Prueba", "123", "Provincia de Prueba", "Pais de Prueba"));
                
                medicoRepository.save(medico);
                System.out.println("Medico user and entity initialized successfully: " + medicoEmail);
            }

            // Crear el paciente de prueba si no existe
            String pacienteEmail = "paciente@vollmed.com";
            if (!usuarioRepository.existsByEmail(pacienteEmail)) {
                Rol pacienteRol = rolRepository.findByNombre(Rol.NombreRol.ROLE_PACIENTE)
                        .orElseGet(() -> rolRepository.save(new Rol(null, Rol.NombreRol.ROLE_PACIENTE)));

                Usuario usuarioPaciente = new Usuario();
                usuarioPaciente.setEmail(pacienteEmail);
                usuarioPaciente.setClave(passwordEncoder.encode("paciente123"));
                usuarioPaciente.setDni("33333333");
                usuarioPaciente.setActivo(true);
                usuarioPaciente.setRoles(Set.of(pacienteRol));

                usuarioPaciente = usuarioRepository.save(usuarioPaciente);

                // Crear entidad Paciente correspondiente
                Paciente paciente = new Paciente();
                paciente.setUsuario(usuarioPaciente);
                paciente.setNombre("Juan Paciente de Prueba");
                paciente.setTelefono("555-5678");
                paciente.setFechaNacimiento(LocalDate.of(1990, 5, 15));
                paciente.setActivo(true);
                paciente.setDireccion(new Direccion("Calle Falsa", "Ciudad de Prueba", "123", "Provincia de Prueba", "Pais de Prueba"));

                pacienteRepository.save(paciente);
                System.out.println("Paciente user and entity initialized successfully: " + pacienteEmail);
            }
        };
    }
}