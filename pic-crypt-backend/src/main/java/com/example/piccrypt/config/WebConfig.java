package com.example.piccrypt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.avatars.dir}")
    private String avatarDir;

    @Value("${app.messages.dir}")
    private String messagesDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/static/avatars/**")
                .addResourceLocations(
                        "classpath:/static/avatars/",
                        "file:" + avatarDir + "/"
                );

        registry.addResourceHandler("/static/messages/**")
                .addResourceLocations("file:" + messagesDir + "/");
    }
}
