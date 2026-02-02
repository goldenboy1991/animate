package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

var cfAI *CloudflareAI

func init() {
	cfAI = NewCloudflareAI()
}

// GenerateCreatureRequest входящий запрос
type GenerateCreatureRequest struct {
	Description string `json:"description"` // "кот", "дракон"
	BlobImage   string `json:"blobImage"`   // base64 кляксы (пока не используем)
}

// GenerateCreatureResponse ответ
type GenerateCreatureResponse struct {
	ImageBase64 string `json:"imageBase64"`
}

func handleGenerateCreature(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var req GenerateCreatureRequest
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Description == "" {
		http.Error(w, "Description required", http.StatusBadRequest)
		return
	}

	// Собираем промпт
	prompt := fmt.Sprintf("A cute friendly %s character, cartoon style, colorful, digital art", req.Description)

	log.Printf("Generating creature with prompt: %s", prompt)

	imageBase64, err := cfAI.GenerateImage(prompt)
	if err != nil {
		log.Printf("Cloudflare error: %v", err)
		http.Error(w, "Image generation failed", http.StatusInternalServerError)
		return
	}

	resp := GenerateCreatureResponse{
		ImageBase64: imageBase64,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
