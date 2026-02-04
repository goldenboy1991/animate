package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/generate-creature", GenerateCreature)

	mux.HandleFunc("/feed", FeedHandler)

	log.Println("Backend startedd on :8080")
	log.Fatal(http.ListenAndServe(":8080", withCORS(mux)))
}
