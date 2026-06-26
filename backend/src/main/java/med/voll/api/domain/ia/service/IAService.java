package med.voll.api.domain.ia.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import med.voll.api.domain.ia.dto.DatosRespuestaAsistenciaDTO;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class IAService {

    @Value("${openrouter.api-key}")
    private String openRouterApiKey;

    @Value("${openrouter.url}")
    private String openRouterUrl;

    @Value("${openrouter.models}")
    private String openRouterModelsRaw;

    @Value("${gemini.base-url}")
    private String geminiBaseUrl;

    @Value("${gemini.api-key}")
    private String geminiApiKey;

    @Value("${gemini.models}")
    private String geminiModelsRaw;

    private final RestTemplate restTemplate = new RestTemplate();

    public DatosRespuestaAsistenciaDTO asistirNota(String texto) {
        String instrucciones = "Eres un asistente médico experto de la clínica VollMed. " +
                "El médico ha escrito unas ideas o palabras generales de evolución clínica del paciente. " +
                "Por favor, redacta una nota de evolución médica profesional y estructurada (en formato SOAP: Subjetivo, Objetivo, Análisis, Plan) " +
                "basándote únicamente en los datos proveídos. Sé claro, profesional y preciso. " +
                "Importante: Retorna únicamente TEXTO PLANO. Utiliza mayúsculas para títulos de secciones, guiones (-) para listas y saltos de línea (\\n) para separar párrafos. " +
                "No incluyas etiquetas HTML, ni formato markdown (como ** o ###), ni bloques de código, ni saludos, ni explicaciones adicionales.";
        
        return ejecutarCascada(texto, instrucciones, true);
    }

    public DatosRespuestaAsistenciaDTO asistirReceta(String texto) {
        String instrucciones = "Eres un asistente médico experto de la clínica VollMed. " +
                "El médico ha provisto unas indicaciones abreviadas de medicamentos. " +
                "Por favor, redacta indicaciones farmacéuticas profesionales, claras y detalladas para el paciente. " +
                "Especifica dosis, frecuencia, duración y recomendaciones de toma de forma ordenada. " +
                "Importante: Retorna únicamente TEXTO PLANO. Utiliza numeración para cada medicamento, guiones (-) para sub-indicaciones y saltos de línea (\\n) para separarlos de forma legible. " +
                "No incluyas etiquetas HTML, ni formato markdown (como ** o ###), ni bloques de código, ni saludos, ni explicaciones adicionales.";
        
        return ejecutarCascada(texto, instrucciones, false);
    }

    private DatosRespuestaAsistenciaDTO ejecutarCascada(String texto, String instrucciones, boolean esNota) {
        // 1. Intentar con OpenRouter
        if (openRouterApiKey != null && !openRouterApiKey.equals("mock-key-for-tests") && openRouterModelsRaw != null) {
            List<String> models = Arrays.stream(openRouterModelsRaw.split(","))
                    .map(String::trim)
                    .filter(m -> !m.isEmpty())
                    .toList();

            for (String model : models) {
                System.out.println("Intentando modelo OpenRouter: " + model);
                String resultado = llamarOpenRouter(texto, instrucciones, model);
                if (resultado != null && !resultado.trim().isEmpty()) {
                    System.out.println("Éxito con modelo OpenRouter: " + model);
                    return new DatosRespuestaAsistenciaDTO(true, resultado, true);
                }
            }
        }

        // 2. Intentar con Gemini
        if (geminiApiKey != null && !geminiApiKey.equals("mock-key-for-tests") && geminiModelsRaw != null) {
            List<String> models = Arrays.stream(geminiModelsRaw.split(","))
                    .map(String::trim)
                    .filter(m -> !m.isEmpty())
                    .toList();

            for (String model : models) {
                System.out.println("Intentando modelo Gemini: " + model);
                String resultado = llamarGemini(texto, instrucciones, model);
                if (resultado != null && !resultado.trim().isEmpty()) {
                    System.out.println("Éxito con modelo Gemini: " + model);
                    return new DatosRespuestaAsistenciaDTO(true, resultado, true);
                }
            }
        }

        // 3. Fallback Local
        System.out.println("Fallaron todos los modelos de IA. Usando expansor clínico local.");
        String fallback = expandirTextoLocal(texto, esNota);
        return new DatosRespuestaAsistenciaDTO(true, fallback, false);
    }

    private String llamarOpenRouter(String texto, String instrucciones, String model) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + openRouterApiKey);
            headers.set("HTTP-Referer", "http://localhost:8080");
            headers.set("X-Title", "VollMed");

            Map<String, Object> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", instrucciones);

            Map<String, Object> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", texto);

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", model);
            payload.put("messages", List.of(systemMsg, userMsg));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(openRouterUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List choices = (List) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map choice = (Map) choices.get(0);
                    Map message = (Map) choice.get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error en modelo OpenRouter [" + model + "]: " + e.getMessage());
        }
        return null;
    }

    private String llamarGemini(String texto, String instrucciones, String model) {
        try {
            String url = geminiBaseUrl + "/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", texto);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(textPart));

            Map<String, Object> systemTextPart = new HashMap<>();
            systemTextPart.put("text", instrucciones);

            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", List.of(systemTextPart));

            Map<String, Object> payload = new HashMap<>();
            payload.put("contents", List.of(content));
            payload.put("systemInstruction", systemInstruction);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List candidates = (List) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map candidate = (Map) candidates.get(0);
                    Map contentObj = (Map) candidate.get("content");
                    if (contentObj != null) {
                        List parts = (List) contentObj.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map part = (Map) parts.get(0);
                            return (String) part.get("text");
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error en modelo Gemini [" + model + "]: " + e.getMessage());
        }
        return null;
    }

    private String expandirTextoLocal(String texto, boolean esNota) {
        if (texto == null || texto.trim().isEmpty()) {
            return "";
        }
        String clean = texto.toLowerCase();
        
        if (esNota) {
            StringBuilder SOAP = new StringBuilder();
            SOAP.append("NOTA DE EVOLUCIÓN CLÍNICA (SOAP)\n\n");
            
            SOAP.append("[S] Subjetivo:\n");
            if (clean.contains("dolor") || clean.contains("cefalea") || clean.contains("fiebre")) {
                SOAP.append("  - El paciente refiere sintomatología activa caracterizada por ");
                if (clean.contains("cefalea") || clean.contains("cabeza")) SOAP.append("cefalea de intensidad moderada. ");
                if (clean.contains("fiebre")) SOAP.append("registro febril autolimitado. ");
                if (clean.contains("dolor")) SOAP.append("dolor localizado de evolución subaguda. ");
                SOAP.append("\n");
            } else {
                SOAP.append("  - Paciente acude a consulta de control y seguimiento general. Manifiesta evolución de base estable.\n");
            }
            
            SOAP.append("\n[O] Objetivo:\n");
            SOAP.append("  - Signos vitales normales. Normotenso. Afebril al examen físico en consultorio.\n");
            if (clean.contains("gripe") || clean.contains("tos") || clean.contains("resfrio")) {
                SOAP.append("  - Faringe levemente congestiva. Auscultación pulmonar normal, murmullo vesicular conservado.\n");
            } else if (clean.contains("presion") || clean.contains("hipertenso")) {
                SOAP.append("  - Monitoreo de presión arterial dentro de parámetros normales de consulta.\n");
            } else {
                SOAP.append("  - Examen físico general sin alteraciones patológicas agudas.\n");
            }
            
            SOAP.append("\n[A] Análisis / Diagnóstico:\n");
            if (clean.contains("gripe") || clean.contains("tos") || clean.contains("resfrio")) {
                SOAP.append("  - Infección respiratoria aguda de vías superiores.\n");
            } else if (clean.contains("presion") || clean.contains("hipertenso")) {
                SOAP.append("  - Hipertensión arterial en estadio de control.\n");
            } else {
                SOAP.append("  - Evolución de control clínico general dentro del rango esperado.\n");
            }
            
            SOAP.append("\n[P] Plan de Tratamiento:\n");
            SOAP.append("  - Pautas de alarma indicadas e indicaciones detalladas provistas al paciente.\n");
            if (clean.contains("ibuprofeno")) {
                SOAP.append("  - Analgésico Ibuprofeno según pauta indicada en la receta.\n");
            }
            if (clean.contains("amoxicilina") || clean.contains("antibiotico")) {
                SOAP.append("  - Antibiótico Amoxicilina. Cumplir estrictamente el esquema temporal indicado.\n");
            }
            SOAP.append("  - Control clínico evolutivo ante aparición de signos de alarma.\n");
            
            SOAP.append("\nNotas originales del profesional: ").append(texto);
            return SOAP.toString();
        } else {
            StringBuilder receta = new StringBuilder();
            receta.append("INDICACIONES DE TRATAMIENTO FARMACÉUTICO\n\n");
            
            boolean match = false;
            if (clean.contains("ibuprofeno")) {
                receta.append("1. Ibuprofeno 600 mg (comprimidos):\n");
                receta.append("   - Tomar 1 comprimido cada 8 horas, vía oral, con alimentos.\n");
                receta.append("   - Duración: 3 a 5 días (ante dolor o fiebre).\n");
                match = true;
            }
            if (clean.contains("amoxicilina")) {
                receta.append("2. Amoxicilina 500 mg (cápsulas):\n");
                receta.append("   - Tomar 1 cápsula cada 8 horas, vía oral, con abundante agua.\n");
                receta.append("   - Duración: 7 días corridos (completar el esquema obligatoriamente).\n");
                match = true;
            }
            if (clean.contains("paracetamol")) {
                receta.append("3. Paracetamol 1 g (comprimidos):\n");
                receta.append("   - Tomar 1 comprimido cada 8 horas ante fiebre alta o molestia intensa, vía oral.\n");
                receta.append("   - Máximo 4 g diarios.\n");
                match = true;
            }
            
            if (!match) {
                receta.append("1. Medicación prescrita por el profesional:\n");
                receta.append("   - Tomar según dosificación recomendada vía oral.\n");
                receta.append("   - Indicaciones generales del facultativo: ").append(texto).append("\n");
            }
            
            receta.append("\nRecomendaciones generales: Reposo, abundante hidratación y control clínico evolutivo.");
            return receta.toString();
        }
    }
}
