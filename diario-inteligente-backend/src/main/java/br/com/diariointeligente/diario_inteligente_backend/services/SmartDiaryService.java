package br.com.diariointeligente.diario_inteligente_backend.services;

import br.com.diariointeligente.diario_inteligente_backend.dtos.GeminiSchemas;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.Executors;

@Service
public class SmartDiaryService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private static final String TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .executor(Executors.newVirtualThreadPerTaskExecutor())
            .build();

    public SmartDiaryService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<?> getAudioAnalise(@RequestParam("file") MultipartFile file)
    {
    try {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("Arquivo vazio");

        var base64Data = Base64.getEncoder().encodeToString(file.getBytes());
        var mimeType = "audio/webm";

        var textPart = new GeminiSchemas.Part("Analise este áudio. Gere um resumo curto e acolhedor, em primeira pessoa, como se fosse um amigo conselheiro.", null);
        var audioPart = new GeminiSchemas.Part(null, new GeminiSchemas.InlineData(mimeType, base64Data));

        var requestPayload = new GeminiSchemas.GeminiRequest(
                List.of(new GeminiSchemas.Content(List.of(textPart, audioPart))),
                null
        );

        String geminiJsonBody = objectMapper.writeValueAsString(requestPayload);

        var geminiRequest = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + "?key=" + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(geminiJsonBody))
                .build();

        var geminiResponse = httpClient.send(geminiRequest, HttpResponse.BodyHandlers.ofString());

        if (geminiResponse.statusCode() != 200) {
            return ResponseEntity.status(geminiResponse.statusCode()).body("Erro Gemini: " + geminiResponse.body());
        }

        var geminiRespObj = objectMapper.readValue(geminiResponse.body(), GeminiSchemas.GeminiResponse.class);
        String insightTexto = geminiRespObj.candidates().getFirst().content().parts().getFirst().text();

        String audioBase64 = generateAudioFromText(insightTexto);

        return ResponseEntity.ok(new GeminiSchemas.BackendResponse(insightTexto, audioBase64));

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.internalServerError().body("Erro no servidor: " + e.getMessage());
    }
}

    private String generateAudioFromText(String text) throws Exception {
        String ttsBody = """
                                {
                                  "input": { "text": "%s" },
                                  "voice": { 
                                      "languageCode": "pt-BR", 
                                      "name": "pt-BR-Neural2-C" 
                                  },
                                  "audioConfig": { 
                                      "audioEncoding": "MP3",
                                      "speakingRate": 0.90,
                                      "pitch": -1.5
                                  }
                                }
    """.formatted(text.replace("\"", "\\\"").replace("\n", " "));

        var ttsRequest = HttpRequest.newBuilder()
                .uri(URI.create(TTS_URL))
                .header("Content-Type", "application/json")
                .header("X-Goog-Api-Key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(ttsBody))
                .build();

        var ttsResponse = httpClient.send(ttsRequest, HttpResponse.BodyHandlers.ofString());

        if (ttsResponse.statusCode() != 200) {
            System.err.println("Erro TTS: " + ttsResponse.body());
            return null;
        }

        JsonNode rootNode = objectMapper.readTree(ttsResponse.body());
        return rootNode.path("audioContent").asText();
    }
}
