package com.example.piccrypt.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthFilter jwtAuthFilter,
                                                   CustomAuthEntryPoint customAuthEntryPoint,
                                                   CustomAccessDeniedHandler customAccessDeniedHandler) throws Exception {

        http.csrf().disable().cors(cors -> {
                cors.configurationSource(corsConfigurationSource());
            })
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(customAuthEntryPoint)   // 401
                        .accessDeniedHandler(customAccessDeniedHandler)   // 403
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/users/**", "/friends/**", "/messages/**")
                        .authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOriginPattern("http://localhost:8081");
        configuration.addAllowedOriginPattern("http://127.0.0.1:8081");
        configuration.addAllowedOriginPattern("http://localhost:19006");
        configuration.addAllowedOriginPattern("http://localhost:19000");
        configuration.addAllowedOriginPattern("http://localhost:3000");

        configuration.setAllowCredentials(true);
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

//    @Bean
//    public SecurityFilterChain securityFilterChain(HttpSecurity http, CustomAuthEntryPoint customAuthEntryPoint,
//                                                   CustomAccessDeniedHandler customAccessDeniedHandler) throws Exception {
//        http
//                .cors(cors -> {})
//                    .exceptionHandling(ex -> ex
//                        .authenticationEntryPoint(customAuthEntryPoint)   // 401
//                        .accessDeniedHandler(customAccessDeniedHandler)   // 403
//                )
//                .csrf().disable()
//                .authorizeHttpRequests(auth -> auth
//                        .anyRequest().permitAll()
//                );
//
//        return http.build();
//    }


}
