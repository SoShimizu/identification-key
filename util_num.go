// util_num.go
package main

import (
	"strconv"
	"strings"
)

func parseFloat(s string) (float64, bool) {
	s = strings.TrimSpace(strings.ReplaceAll(s, ",", ""))
	if s == "" || strings.EqualFold(s, "na") || strings.EqualFold(s, "unknown") {
		return 0, false
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, false
	}
	return v, true
}

// ✨ 新規追加: 範囲文字列をパースする
func parseRange(s string) (min, max float64, ok bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, 0, false
	}

	parts := strings.Split(s, "-")
	if len(parts) == 1 {
		val, ok := parseFloat(s)
		if !ok {
			return 0, 0, false
		}
		return val, val, true
	}

	if len(parts) == 2 {
		min, ok1 := parseFloat(parts[0])
		max, ok2 := parseFloat(parts[1])
		if ok1 && ok2 && min <= max {
			return min, max, true
		}
	}

	return 0, 0, false
}
