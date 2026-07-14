package port

import "context"

type BugCounter interface {
	Count(ctx context.Context) (int64, error)
}
