// backend/app.go
package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"my-id-key/backend/engine"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context

	// Keys dir & current selection
	keysDir       string
	currentKey    string
	currentPath   string
	currentMatrix *engine.Matrix
}

// NewApp provides an instance
func NewApp() *App {
	return &App{
		keysDir: "keys", // ルート直下 keys/ に置く。必要ならここを変更
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.LogInfo(a.ctx, "[startup] backend starting")
	_ = os.MkdirAll(a.keysDir, 0o755)
}

// ---- internal helpers ----

func (a *App) setCurrentKeyByPath(p string) error {
	if p == "" {
		return errors.New("empty path")
	}
	m := &engine.Matrix{}
	if _, err := m.LoadMatrixExcel(p); err != nil {
		return fmt.Errorf("load matrix: %w", err)
	}
	a.currentMatrix = m
	a.currentPath = p
	a.currentKey = filepath.Base(p)
	// UIへ反映
	runtime.EventsEmit(a.ctx, "matrix_changed")
	return nil
}

func (a *App) listXLSX() ([]KeyInfo, error) {
	var items []KeyInfo
	entries, err := os.ReadDir(a.keysDir)
	if err != nil {
		return nil, err
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if filepath.Ext(e.Name()) != ".xlsx" {
			continue
		}
		fi, err := os.Stat(filepath.Join(a.keysDir, e.Name()))
		if err != nil {
			continue
		}
		items = append(items, KeyInfo{
			Name:    e.Name(),
			Path:    filepath.Join(a.keysDir, e.Name()),
			Size:    fi.Size(),
			Ext:     filepath.Ext(e.Name()),
			ModTime: fi.ModTime().Format(time.RFC3339),
		})
	}
	sort.Slice(items, func(i, j int) bool { return items[i].Name < items[j].Name })
	return items, nil
}
