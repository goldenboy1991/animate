package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

type GenerateRequest struct {
	Description string `json:"description"`
}

type CFResponse struct {
	Result struct {
		Image string `json:"image"` // base64
	} `json:"result"`
}

type GenerateResponse struct {
	ImageURL string `json:"image_url"`
}

func GenerateCreature(w http.ResponseWriter, r *http.Request) {
	log.Printf("GenerateCreature called: method=%s, path=%s", r.Method, r.URL.Path)

	if r.Method != http.MethodPost {
		log.Println("Wrong method, returning 405")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("JSON decode error:", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Description == "" {
		http.Error(w, "empty description", 400)
		return
	}

	// КРИТИЧНО: проверка env
	accountID := os.Getenv("CF_ACCOUNT_ID")
	apiToken := os.Getenv("CF_API_TOKEN")

	if accountID == "" || apiToken == "" {
		log.Println("ERROR: CF_ACCOUNT_ID or CF_API_TOKEN not set")
		http.Error(w, "Server misconfiguration", http.StatusInternalServerError)
		return
	}

	log.Printf("Using Cloudflare account: %s (token length: %d)", accountID, len(apiToken))

	prompt := "Cute cartoon creature for kids, based on ink blot, " + req.Description

	body := map[string]interface{}{
		"prompt": prompt,
	}

	jsonBody, _ := json.Marshal(body)

	url := "https://api.cloudflare.com/client/v4/accounts/" + accountID +
		"/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0"

	log.Printf("Cloudflare URL: %s", url)

	httpReq, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	httpReq.Header.Set("Authorization", "Bearer "+apiToken)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Println("Cloudflare request error:", err)
		http.Error(w, "AI error", 500)
		return
	}
	defer resp.Body.Close()

	log.Printf("Cloudflare response status: %d", resp.StatusCode)

	// ВАЖНО: проверяй статус ответа
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Cloudflare error response: %s", string(bodyBytes))
		http.Error(w, "AI generation failed", http.StatusInternalServerError)
		return
	}

	var cfResp CFResponse
	if err := json.NewDecoder(resp.Body).Decode(&cfResp); err != nil {
		log.Println("Cloudflare response decode error:", err)
		http.Error(w, "Invalid AI response", http.StatusInternalServerError)
		return
	}

	log.Printf("Got image from Cloudflare, base64 length: %d", len(cfResp.Result.Image))

	if cfResp.Result.Image == "" {
		log.Println("WARNING: Cloudflare returned empty image")
	}

	result := map[string]string{
		"image": "data:image/png;base64," + cfResp.Result.Image,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
	log.Println("=== GenerateCreature completed ===")
}

func FeedHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"fed"}`))
}
