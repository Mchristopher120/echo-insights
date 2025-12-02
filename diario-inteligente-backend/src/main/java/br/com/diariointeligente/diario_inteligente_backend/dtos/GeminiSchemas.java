package br.com.diariointeligente.diario_inteligente_backend.dtos;

import java.util.List;

// Usando Records do Java para criar classes imutáveis e limpas
public class GeminiSchemas {

    // Requisição
    public record GeminiRequest(List<Content> contents) {}
    public record Content(List<Part> parts) {}
    public record Part(String text, InlineData inline_data) {}
    public record InlineData(String mime_type, String data) {}

    // Resposta (Simplificada para o exemplo)
    public record GeminiResponse(List<Candidate> candidates) {}
    public record Candidate(Content content) {}
}
