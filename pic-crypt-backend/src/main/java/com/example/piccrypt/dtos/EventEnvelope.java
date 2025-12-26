package com.example.piccrypt.dtos;

import java.util.Map;

public class EventEnvelope {
    private String entity;
    private String action;
    private Map<String, Object> data;
    private String sender;

    public EventEnvelope() {}

    public EventEnvelope(String entity, String action, Map<String, Object> data, String sender) {
        this.entity = entity;
        this.action = action;
        this.data = data;
        this.sender = sender;
    }

    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
}
