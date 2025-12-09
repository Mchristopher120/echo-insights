package br.com.diariointeligente.diario_inteligente_backend.dtos;

import java.util.List;

public class GeminiSchemas {
    // Request simples sem config de modalidade
    public record GeminiRequest(List<Content> contents, Object generationConfig) {}

    public record Content(List<Part> parts) {}
    public record Part(String text, InlineData inline_data) {}
    public record InlineData(String mime_type, String data) {}

    public record GeminiResponse(List<Candidate> candidates) {}
    public record Candidate(Content content) {}

    // Este DTO continua igual: devolvemos Texto + Audio pro React
    public record BackendResponse(String insight, String audioBase64) {}
}