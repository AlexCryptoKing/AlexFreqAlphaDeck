"""API routes and endpoints."""

from fastapi import APIRouter

from src.api.alerts import router as alerts_router
from src.api.auth import router as auth_router
from src.api.backtest import router as backtest_router
from src.api.bots import router as bots_router
from src.api.discovery import router as discovery_router
from src.api.historic import router as historic_router
from src.api.portfolio import router as portfolio_router
from src.api.users import router as users_router
from src.api.agent import router as agent_router

# Main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(backtest_router, prefix="/backtest", tags=["backtest"])
api_router.include_router(bots_router, prefix="/bots", tags=["bots"])
api_router.include_router(discovery_router, prefix="/discovery", tags=["discovery"])
api_router.include_router(historic_router, prefix="/historic", tags=["historic"])
api_router.include_router(portfolio_router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(agent_router, prefix="/agent", tags=["agent"])

__all__ = ["api_router"]
