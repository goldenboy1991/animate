package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/generate-creature", GenerateCreatureHandler)
	mux.HandleFunc("/feed", FeedHandler)

	log.Println("Backend started on :8080")
	log.Fatal(http.ListenAndServe(":8080", withCORS(mux)))
}
