package med.voll.api.repository;

import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.domain.usuarios.repository.IUsuarioRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

@SpringBootTest
public class IUsuarioRepositoryTest {

    @Autowired
    private IUsuarioRepository usuarioRepo;

    @Test
    void testFindByLogin() {
        String username = "julia";

        Optional<Usuario> usuarioOptional = usuarioRepo.findByEmail(username);

        Assertions.assertTrue(usuarioOptional.isPresent(), "El usuario no fue encontrado en la base de datos.");

        Usuario usuario = usuarioOptional.get();
        System.out.println("Usuario encontrado: " + usuario.getEmail());
    }
}
