package med.voll.api;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiApplication {

	public static void main(String[] args) {
		try {
			Dotenv dotenv = Dotenv.configure()
					.directory("./backend")
					.ignoreIfMalformed()
					.ignoreIfMissing()
					.load();
			dotenv.entries().forEach(entry -> {
				System.setProperty(entry.getKey(), entry.getValue());
			});
		} catch (Exception e) {
			try {
				Dotenv dotenv = Dotenv.configure()
						.ignoreIfMalformed()
						.ignoreIfMissing()
						.load();
				dotenv.entries().forEach(entry -> {
					System.setProperty(entry.getKey(), entry.getValue());
				});
			} catch (Exception ex) {
				System.out.println("No se pudo cargar el archivo .env: " + ex.getMessage());
			}
		}

		System.out.println("=== ANTIGRAVITY DEBUG SYSTEM ===");
		System.out.println("System.getenv(\"DB_URL\") (OS Global): " + System.getenv("DB_URL"));
		System.out.println("System.getenv(\"VOLLMED_DB_URL\"): " + System.getenv("VOLLMED_DB_URL"));
		System.out.println("System.getProperty(\"VOLLMED_DB_URL\"): " + System.getProperty("VOLLMED_DB_URL"));
		System.out.println("System.getenv(\"VOLLMED_DB_USER\"): " + System.getenv("VOLLMED_DB_USER"));
		System.out.println("=================================");

		SpringApplication.run(ApiApplication.class, args);
	}

}
