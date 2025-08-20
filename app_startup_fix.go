// backend/app_startup_fix.go
package main

import "context"

// Wails: OnStartup は func(ctx context.Context) を要求する。
// 既存の内部初期化ロジック a.startup(ctx) を呼び出す薄いラッパー。
func (a *App) Startup(ctx context.Context) {
	a.startup(ctx)
}
