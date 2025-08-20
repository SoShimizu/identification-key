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
