package domain_mgmt

import (
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/domain-service/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/domain-service/internal/module/domain_mgmt/delivery"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/domain-service/internal/module/domain_mgmt/port"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/domain-service/internal/module/domain_mgmt/repository"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/domain-service/internal/module/domain_mgmt/usecase"
	sharedPort "github.com/hidessh99/sub-cf-vpn/microservice-checker/domain-service/internal/shared/port"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type DomainModule struct {
	Handler *delivery.DomainHandler
	Counter port.DomainCounter
	cfg     *config.AppConfig
	log     sharedPort.Logger
}

func NewDomainModule(db *gorm.DB, cfg *config.AppConfig, log sharedPort.Logger) *DomainModule {
	domainRepo := repository.NewDomainRepository(db)
	domainUC := usecase.NewDomainUseCase(domainRepo, log)
	handler := delivery.NewDomainHandler(domainUC, log)

	counter, ok := domainUC.(port.DomainCounter)
	if !ok {
		panic("domainUseCase does not implement port.DomainCounter")
	}

	return &DomainModule{
		Handler: handler,
		Counter: counter,
		cfg:     cfg,
		log:     log,
	}
}

func (m *DomainModule) RegisterRoutes(adminGroup *echo.Group, publicGroup *echo.Group) {
	delivery.RegisterRoutes(adminGroup, publicGroup, m.Handler)
}
