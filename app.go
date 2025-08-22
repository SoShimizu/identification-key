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

	// ✨ アプリケーションの基準パス（実行可能ファイルの場所）
	basePath string

	// Keys dir & current selection
	keysDir       string
	reportsDir    string // NEW: for reports
	currentKey    string
	currentPath   string
	currentMatrix *engine.Matrix
}

// NewApp provides an instance
func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.LogInfo(a.ctx, "[startup] backend starting")

	// ✨ 実行可能ファイルのパスを取得
	exePath, err := os.Executable()
	if err != nil {
		runtime.LogErrorf(a.ctx, "Failed to get executable path: %v", err)
		a.basePath = "." // フォールバック
	} else {
		a.basePath = filepath.Dir(exePath)
	}
	runtime.LogInfof(a.ctx, "Base path set to: %s", a.basePath)

	// keysDirを絶対パスで設定
	a.keysDir = filepath.Join(a.basePath, "keys")
	runtime.LogInfof(a.ctx, "Keys directory set to: %s", a.keysDir)
	_ = os.MkdirAll(a.keysDir, 0o755)

	// NEW: Create and set reports directory
	a.reportsDir = filepath.Join(a.basePath, "my_identification_reports")
	runtime.LogInfof(a.ctx, "Reports directory set to: %s", a.reportsDir)
	_ = os.MkdirAll(a.reportsDir, 0o755)
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
		return nil, fmt.Errorf("failed to read keys directory %s: %w", a.keysDir, err)
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if filepath.Ext(e.Name()) != ".xlsx" {
			continue
		}
		fullPath := filepath.Join(a.keysDir, e.Name())
		fi, err := os.Stat(fullPath)
		if err != nil {
			continue
		}
		items = append(items, KeyInfo{
			Name:    e.Name(),
			Path:    fullPath,
			Size:    fi.Size(),
			Ext:     filepath.Ext(e.Name()),
			ModTime: fi.ModTime().Format(time.RFC3339),
		})
	}
	sort.Slice(items, func(i, j int) bool { return items[i].Name < items[j].Name })
	return items, nil
}
