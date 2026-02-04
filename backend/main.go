package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	mux := http.NewServeMux()

	http.HandleFunc("/api/generate-creature", GenerateCreature)
	mux.HandleFunc("/feed", FeedHandler)
	log.Println(os.Getenv("CF_ACCOUNT_ID"))

	log.Println("Backend started on :8080")
	log.Fatal(http.ListenAndServe(":8080", withCORS(mux)))
}
