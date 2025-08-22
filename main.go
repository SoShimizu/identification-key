package main

import (
	"context"
	"embed"
	"log"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// --- LOGGING SETUP ---
	log.SetOutput(os.Stdout)
	log.SetFlags(log.Ltime | log.Lshortfile)
	log.Println("===== Application Starting =====")
	// --- END LOGGING SETUP ---

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "ClavisID",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: func(ctx context.Context) { // MODIFIED: Pass context to startup
			app.startup(ctx)
		},
		StartHidden:      false,
		WindowStartState: options.Maximised,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Printf("Wails Run Error: %v", err)
	}
	log.Println("===== Application Closing =====")
}
