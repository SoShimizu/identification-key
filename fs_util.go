// backend/fs_util.go
package main

import (
	"os"
	"path/filepath"
)

// writeText ensures dir and writes text
func writeText(path, body string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(body), 0o644)
}
