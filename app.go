package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"my-id-key/backend/engine"

	"github.com/google/uuid" // ★ google/uuid パッケージをインポート
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context

	basePath string

	keysDir    string
	reportsDir string
	// ★ ヘルパー画像のディレクトリパスを追加
	helperImagesDir string
	currentKey      string
	currentPath     string
	currentMatrix   *engine.Matrix
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.LogInfo(a.ctx, "[startup] backend starting")

	exePath, err := os.Executable()
	if err != nil {
		runtime.LogErrorf(a.ctx, "Failed to get executable path: %v", err)
		a.basePath = "."
	} else {
		a.basePath = filepath.Dir(exePath)
	}
	runtime.LogInfof(a.ctx, "Base path set to: %s", a.basePath)

	a.keysDir = filepath.Join(a.basePath, "keys")
	runtime.LogInfof(a.ctx, "Keys directory set to: %s", a.keysDir)
	_ = os.MkdirAll(a.keysDir, 0o755)

	a.reportsDir = filepath.Join(a.basePath, "my_identification_reports")
	runtime.LogInfof(a.ctx, "Reports directory set to: %s", a.reportsDir)
	_ = os.MkdirAll(a.reportsDir, 0o755)

	// ★ ヘルパー画像ディレクトリを設定
	a.helperImagesDir = filepath.Join(a.basePath, "helper_materi")
	runtime.LogInfof(a.ctx, "Helper images directory set to: %s", a.helperImagesDir)
	_ = os.MkdirAll(a.helperImagesDir, 0o755)
}

// --- ★ここから下を全て追加 ---

// GenerateUUID は新しいUUID v4を生成して文字列として返します。
func (a *App) GenerateUUID() string {
	return uuid.NewString()
}

// ListHelperImages は a.helperImagesDir 内にある画像ファイルの一覧を返します。
func (a *App) ListHelperImages() ([]string, error) {
	var imageFiles []string
	runtime.LogInfof(a.ctx, "Listing helper images in: %s", a.helperImagesDir)

	entries, err := os.ReadDir(a.helperImagesDir)
	if err != nil {
		if os.IsNotExist(err) {
			runtime.LogWarningf(a.ctx, "Helper images directory does not exist: %s", a.helperImagesDir)
			return []string{}, nil // ディレクトリが存在しない場合は空を返す
		}
		runtime.LogErrorf(a.ctx, "Failed to read helper images directory '%s': %v", a.helperImagesDir, err)
		return nil, err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			ext := filepath.Ext(strings.ToLower(entry.Name()))
			// 一般的な画像拡張子をチェック
			if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".bmp" {
				imageFiles = append(imageFiles, entry.Name())
			}
		}
	}
	sort.Strings(imageFiles)
	runtime.LogInfof(a.ctx, "Found %d helper images.", len(imageFiles))
	return imageFiles, nil
}

// --- ★ここまで追加 ---

// ( ... setCurrentKeyByPath, listXLSX, SelectKeysDirectory, GetKeysDirectory などの既存の関数は変更なし ...)
// ---- internal helpers ----

func (a *App) setCurrentKeyByPath(p string) error {
	if p == "" {
		return errors.New("empty path")
	}

	matrix, err := engine.LoadMatrixExcel(p)
	if err != nil {
		return fmt.Errorf("load matrix: %w", err)
	}

	a.currentMatrix = matrix
	a.currentPath = p
	a.currentKey = filepath.Base(p)

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

func (a *App) SelectKeysDirectory() (string, error) {
	dirPath, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Matrix Directory",
	})
	if err != nil {
		return "", err
	}
	if dirPath == "" {
		return a.keysDir, nil
	}

	a.keysDir = dirPath
	runtime.LogInfof(a.ctx, "User changed keys directory to: %s", a.keysDir)
	return a.keysDir, nil
}

func (a *App) GetKeysDirectory() string {
	return a.keysDir
}
