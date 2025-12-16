package br.com.diariointeligente.diario_inteligente_backend.controllers;

import br.com.diariointeligente.diario_inteligente_backend.services.SmartDiaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/audio/analyzer")
@CrossOrigin(origins = "*")
public class SmartDiaryController {

    @Autowired
    SmartDiaryService smartDiaryService;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeAudio(@RequestParam("file") MultipartFile file) {
        return smartDiaryService.getAudioAnalise(file);
}}