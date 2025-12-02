package br.com.diariointeligente.diario_inteligente_backend.controllers;

import br.com.diariointeligente.diario_inteligente_backend.dtos.GeminiSchemas;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/audio/analyzer")
@CrossOrigin(origins = "http://localhost:8080")
public class SmartDiaryController {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .executor(Executors.newVirtualThreadPerTaskExecutor())
            .build();

    public SmartDiaryController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }


    @PostMapping("/analyze")
    public ResponseEntity<String> analyzeAudio(@RequestParam("file") MultipartFile file) {
        try {

            if (file.isEmpty()) return ResponseEntity.badRequest().body("Arquivo vazio");


            var base64Data = Base64.getEncoder().encodeToString(file.getBytes());
            var mimeType = "audio/webm";


            var textPart = new GeminiSchemas.Part("Sua função é fazer resumos de audios gravados pelo usuário contando sobre acontecimentos do dia deles. Gere um breve resumo sobre esse audio, apontando pontos importantes sobre ele", null);
            var audioPart = new GeminiSchemas.Part(null, new GeminiSchemas.InlineData(mimeType, base64Data));

            var requestPayload = new GeminiSchemas.GeminiRequest(
                    List.of(new GeminiSchemas.Content(List.of(textPart, audioPart)))
            );

            String jsonBody = objectMapper.writeValueAsString(requestPayload);

            var request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_URL + "?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return ResponseEntity.status(response.statusCode()).body("Erro Gemini: " + response.body());
            }

            var geminiResp = objectMapper.readValue(response.body(), GeminiSchemas.GeminiResponse.class);
            String finalOutput = geminiResp.candidates().getFirst().content().parts().getFirst().text();

            return ResponseEntity.ok(finalOutput);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erro no servidor: " + e.getMessage());
        }
    }
}
