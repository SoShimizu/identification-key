// backend/logger.go
package main

import (
	"fmt"
	"time"
)

func logf(format string, args ...any) {
	now := time.Now().Format("15:04:05.000")
	fmt.Printf("[%s] %s\n", now, fmt.Sprintf(format, args...))
}
