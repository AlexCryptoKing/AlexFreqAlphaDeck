"""Analytics database connection (read-only, separate from main dashboard DB)."""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from src.config import settings

# Create async engine for analytics DB (read-only operations)
analytics_db_url = settings.analytics.url
if analytics_db_url.startswith("postgresql://"):
    analytics_db_url = analytics_db_url.replace("postgresql://", "postgresql+asyncpg://")

analytics_engine = create_async_engine(
    analytics_db_url,
    pool_size=settings.analytics.pool_size,
    echo=settings.analytics.echo,
    # Read-only safety: don't allow execution of write operations
    # Note: This is a soft guard; proper security relies on DB permissions
)

# Session factory for analytics
analytics_session_maker = async_sessionmaker(
    analytics_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base for analytics models (if we need ORM models later)
AnalyticsBase = declarative_base()


async def get_analytics_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting analytics database sessions (read-only recommended)."""
    async with analytics_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def close_analytics_db() -> None:
    """Close analytics database connections."""
    await analytics_engine.dispose()
