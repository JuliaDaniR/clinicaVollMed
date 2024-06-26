package med.voll.api.infra.security;

import med.voll.api.domain.usuarios.Usuario;
import med.voll.api.repository.IUsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
public class AutenticacionService implements UserDetailsService {

    @Autowired
    private IUsuarioRepository usuarioRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("Username: " + username);
        Usuario usuario = (Usuario) usuarioRepo.findByLogin(username);
        System.out.println("Usuario: " + usuario);

        if (usuario == null) {
            throw new UsernameNotFoundException("Usuario no encontrado: " + username);
        }

        return usuario;
    }
}
