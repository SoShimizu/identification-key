package engine

import "math"

// 合計1へ正規化（合計0なら等確率）
func normalize(p []float64) {
	sum := 0.0
	for _, v := range p {
		sum += v
	}
	if sum <= 0 {
		if len(p) == 0 {
			return
		}
		eq := 1.0 / float64(len(p))
		for i := range p {
			p[i] = eq
		}
		return
	}
	inv := 1.0 / sum
	for i := range p {
		p[i] *= inv
	}
}

// Shannon エントロピー（底2）
func shannon(p []float64) float64 {
	h := 0.0
	for _, v := range p {
		if v > 0 {
			h -= v * math.Log2(v)
		}
	}
	return h
}

// しきい値以上の数
func countAbove(p []float64, thr float64) int {
	n := 0
	for _, v := range p {
		if v >= thr {
			n++
		}
	}
	return n
}
