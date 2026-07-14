package port

import "context"

type ProxyCounter interface {
	Count(ctx context.Context) (int64, error)
}
