package jwt

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func ParseDuration(durationStr string) (time.Duration, error) {
	durationStr = strings.TrimSpace(durationStr)
	if durationStr == "" {
		return 24 * time.Hour, nil
	}

	// Handle days suffix since time.ParseDuration doesn't support "d"
	if strings.HasSuffix(durationStr, "d") {
		daysVal := strings.TrimSuffix(durationStr, "d")
		days, err := strconv.Atoi(daysVal)
		if err != nil {
			return 0, fmt.Errorf("invalid days format: %w", err)
		}
		return time.Duration(days) * 24 * time.Hour, nil
	}

	return time.ParseDuration(durationStr)
}

func SignToken(claims map[string]interface{}, secret string, expiresIn string) (string, error) {
	duration, err := ParseDuration(expiresIn)
	if err != nil {
		duration = 24 * time.Hour
	}

	jwtClaims := jwt.MapClaims{}
	for k, v := range claims {
		jwtClaims[k] = v
	}

	now := time.Now()
	jwtClaims["iat"] = now.Unix()
	jwtClaims["exp"] = now.Add(duration).Unix()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwtClaims)
	return token.SignedString([]byte(secret))
}

func VerifyToken(tokenStr string, secret string) (map[string]interface{}, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
