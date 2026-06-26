package med.voll.api.infra.security;

import lombok.RequiredArgsConstructor;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.domain.usuarios.repository.IUsuarioRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AutenticacionService implements UserDetailsService {

    private final IUsuarioRepository usuarioRepo;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        System.out.println("Buscando usuario: " + username);

        Usuario usuario = usuarioRepo.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        System.out.println("Usuario encontrado: " + usuario);

        return usuario;
    }
    public Usuario getUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("No hay usuario autenticado");
        }

        return usuarioRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado en la BD"));
    }
}
