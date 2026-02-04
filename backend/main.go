package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	http.HandleFunc("/api/generate-creature", GenerateCreature)

	mux.HandleFunc("/feed", FeedHandler)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Println("PATH:", r.URL.Path)
		http.NotFound(w, r)
	})

	log.Println("Backend startedd on :8080")
	log.Fatal(http.ListenAndServe(":8080", withCORS(mux)))
}
