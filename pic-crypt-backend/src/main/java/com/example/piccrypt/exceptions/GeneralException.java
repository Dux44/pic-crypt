package com.example.piccrypt.exceptions;

import org.springframework.http.HttpStatus;

public class GeneralException extends  RuntimeException {
    public HttpStatus status;
    public GeneralException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
}
