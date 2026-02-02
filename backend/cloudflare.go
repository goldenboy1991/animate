package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// CloudflareAI клиент для Workers AI
type CloudflareAI struct {
	AccountID string
	APIToken  string
	BaseURL   string
}

// NewCloudflareAI создаёт клиент
func NewCloudflareAI() *CloudflareAI {
	return &CloudflareAI{
		AccountID: os.Getenv("CF_ACCOUNT_ID"),
		APIToken:  os.Getenv("CF_API_TOKEN"),
		BaseURL:   "https://api.cloudflare.com/client/v4/accounts",
	}
}

// GenerateImageRequest запрос к SD XL
type GenerateImageRequest struct {
	Prompt string `json:"prompt"`
}

// GenerateImageResponse ответ от CF
type GenerateImageResponse struct {
	Result struct {
		Image string `json:"image"` // base64
	} `json:"result"`
	Success bool     `json:"success"`
	Errors  []string `json:"errors"`
}

// GenerateImage отправляет запрос в Stable Diffusion XL
func (c *CloudflareAI) GenerateImage(prompt string) (string, error) {
	url := fmt.Sprintf("%s/%s/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0",
		c.BaseURL, c.AccountID)

	reqBody := GenerateImageRequest{
		Prompt: prompt,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+c.APIToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("cloudflare error: %d, body: %s", resp.StatusCode, string(body))
	}

	var result GenerateImageResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	if !result.Success {
		return "", fmt.Errorf("cloudflare errors: %v", result.Errors)
	}

	return result.Result.Image, nil
}
