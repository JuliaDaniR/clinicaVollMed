package med.voll.api.domain.usuarios.model;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.shared.BaseAuditable;
import med.voll.api.domain.usuarios.dto.DatosRegistroUsuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Entity(name = "Usuario")
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Usuario extends BaseAuditable implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;
    private String clave;

    private String nombre;
    private String telefono;

    @Column(unique = true)
    private String dni;

    private Boolean activo = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "usuario_roles",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "rol_id")
    )
    private Set<Rol> roles = new HashSet<>();

    public Usuario(DatosRegistroUsuario datos, Rol rolPorDefecto) {
        this.email = datos.email();
        this.clave = new BCryptPasswordEncoder().encode(datos.clave());
        this.nombre = datos.nombre();
        this.telefono = datos.telefono();
        this.dni = datos.dni();
        this.roles.add(rolPorDefecto);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(rol -> new SimpleGrantedAuthority(rol.getNombre().name()))
                .toList();
    }

    @Override public String getPassword() { return clave; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() {
        return this.activo;
    }

    public void desactivar(String usuario) {
        this.activo = false;
        this.softDelete(usuario);
    }

    public void activar() {
        this.activo = true;
        this.deletedAt = null;
        this.deletedBy = null;
    }
    public boolean tieneRol(Rol.NombreRol rol) {
        return roles.stream().anyMatch(r -> r.getNombre().equals(rol));
    }
}