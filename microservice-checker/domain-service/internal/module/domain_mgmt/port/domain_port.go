package port

import "context"

type DomainCounter interface {
	Count(ctx context.Context) (int64, error)
}
