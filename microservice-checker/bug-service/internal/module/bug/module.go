package bug

import (
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/module/bug/delivery"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/module/bug/port"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/module/bug/repository"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/module/bug/usecase"
	sharedPort "github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/shared/port"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type BugModule struct {
	Handler *delivery.BugHandler
	Counter port.BugCounter
	cfg     *config.AppConfig
	log     sharedPort.Logger
}

func NewBugModule(db *gorm.DB, cfg *config.AppConfig, log sharedPort.Logger) *BugModule {
	bugRepo := repository.NewBugRepository(db)
	bugUC := usecase.NewBugUseCase(bugRepo, log)
	handler := delivery.NewBugHandler(bugUC, log)

	counter, ok := bugUC.(port.BugCounter)
	if !ok {
		panic("bugUseCase does not implement port.BugCounter")
	}

	return &BugModule{
		Handler: handler,
		Counter: counter,
		cfg:     cfg,
		log:     log,
	}
}

func (m *BugModule) RegisterRoutes(adminGroup *echo.Group, publicGroup *echo.Group) {
	delivery.RegisterRoutes(adminGroup, publicGroup, m.Handler)
}
