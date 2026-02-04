package main

import (
	"bytes"
	"encoding/json"
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
	var req GenerateRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.Description == "" {
		http.Error(w, "empty description", 400)
		return
	}

	prompt := "Cute cartoon creature for kids, based on ink blot, " + req.Description

	body := map[string]interface{}{
		"prompt": prompt,
	}

	jsonBody, _ := json.Marshal(body)

	url := "https://api.cloudflare.com/client/v4/accounts/" +
		os.Getenv("CF_ACCOUNT_ID") +
		"/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0"

	httpReq, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	httpReq.Header.Set("Authorization", "Bearer "+os.Getenv("CF_API_TOKEN"))
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		http.Error(w, "AI error", 500)
		return
	}
	defer resp.Body.Close()

	var cfResp CFResponse
	json.NewDecoder(resp.Body).Decode(&cfResp)

	result := map[string]string{
		"image": "data:image/png;base64," + cfResp.Result.Image,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func FeedHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"fed"}`))
}

func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

		if r.Method == "OPTIONS" {
			return
		}

		h.ServeHTTP(w, r)
	})
}
