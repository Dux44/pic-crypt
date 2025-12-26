package com.example.piccrypt.controllers;

import com.example.piccrypt.services.SteganographyService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/stego")
public class SteganographyController {

    private final SteganographyService stenographyService;

    public SteganographyController(SteganographyService stenographyService) {
        this.stenographyService = stenographyService;
    }

    @PostMapping("/encrypt")
    public ResponseEntity<?> encryptImage(@RequestParam("image") MultipartFile file,
                                          @RequestParam("password") String password, @RequestParam("text") String text) {
        try {
            File inputFile = convertToFile(file);
            File encrypted = stenographyService.encrypt(inputFile, text, password);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=" + encrypted.getName())
                    .contentType(MediaType.IMAGE_GIF)
                    .body(new FileSystemResource(encrypted));
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("message", "Encrypt failed: " + e.getMessage()));
        }
    }


    @PostMapping("/decrypt")
    public ResponseEntity<?> decryptImage(@RequestParam("image") MultipartFile file,
                                               @RequestParam("password") String password) {
        try {
            File inputFile = convertToFile(file);

            String text = stenographyService.decrypt(inputFile, password);

            return ResponseEntity.ok(Map.of("message", text));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Decrypt failed: " + e.getMessage()));
        }
    }

    @PostMapping("/encrypt/url")
    public ResponseEntity<?> encryptAndStore(@RequestParam("image") MultipartFile file,
                                             @RequestParam("password") String password,
                                             @RequestParam("text") String text) {
        try {
            String url = stenographyService.encryptAndStore(file, text, password);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("message", "Encrypt failed: " + e.getMessage()));
        }
    }

    @PostMapping("/store")
    public ResponseEntity<?> storeWithoutEncryption(@RequestParam("image") MultipartFile file) {
        try {
            String url = stenographyService.storeWithoutEncryption(file);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("message", "Store failed: " + e.getMessage()));
        }
    }

//    @PostMapping("/decrypt/url")
//    public ResponseEntity<?> decryptByUrl(@RequestParam("imageUrl") String imageUrl,
//                                          @RequestParam("password") String password) {
//        try {
//            String text = stenographyService.decryptFromUrl(imageUrl, password);
//            return ResponseEntity.ok(Map.of("message", text));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of("message", "Decrypt failed: " + e.getMessage()));
//        }
//    }

    private File convertToFile(MultipartFile multipartFile) throws IOException {
        File conv = File.createTempFile("upload_", multipartFile.getOriginalFilename());
        multipartFile.transferTo(conv);
        return conv;
    }

}