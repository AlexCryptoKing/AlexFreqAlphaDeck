"""
Crypto data collector for MultibotdashboardV7
Fetches data from CoinGecko API
"""

import asyncio
import aiohttp
import asyncpg
from datetime import datetime
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

# Top coins to track
DEFAULT_COINS = [
    'bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot',
    'ripple', 'dogecoin', 'tron', 'avalanche-2', 'chainlink'
]

class CryptoCollector:
    """Collects cryptocurrency data from CoinGecko."""
    
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.db_config = {
            'host': '192.168.0.210',
            'port': 5432,
            'user': 'dashboard',
            'password': 'dashboard',
            'database': 'financial_data'
        }
    
    async def fetch_prices(self) -> List[Dict]:
        """Fetch current prices from CoinGecko."""
        url = f"{self.base_url}/coins/markets"
        params = {
            'vs_currency': 'usd',
            'ids': ','.join(DEFAULT_COINS),
            'order': 'market_cap_desc',
            'per_page': 100,
            'page': 1,
            'sparkline': False,
            'price_change_percentage': '24h'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"CoinGecko API error: {response.status}")
                    return []
    
    async def save_to_db(self, data: List[Dict]):
        """Save crypto data to database."""
        pool = await asyncpg.create_pool(**self.db_config)
        
        async with pool.acquire() as conn:
            for coin in data:
                await conn.execute(
                    """
                    INSERT INTO crypto_prices 
                    (coin_id, symbol, name, price_usd, market_cap, volume_24h, change_24h_pct, source)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'coingecko')
                    """,
                    coin['id'],
                    coin['symbol'].upper(),
                    coin['name'],
                    coin['current_price'],
                    coin['market_cap'],
                    coin['total_volume'],
                    coin.get('price_change_percentage_24h')
                )
        
        await pool.close()
        logger.info(f"Saved {len(data)} crypto prices to DB")
    
    async def run(self):
        """Run the collector."""
        try:
            logger.info("Starting crypto collection...")
            data = await self.fetch_prices()
            if data:
                await self.save_to_db(data)
                await self._log_sync('crypto_prices', 'success', len(data))
            else:
                await self._log_sync('crypto_prices', 'error', 0, 'No data received')
        except Exception as e:
            logger.error(f"Crypto collector error: {e}")
            await self._log_sync('crypto_prices', 'error', 0, str(e))
    
    async def _log_sync(self, source: str, status: str, records: int, error: str = None):
        """Log sync status."""
        pool = await asyncpg.create_pool(**self.db_config)
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO sync_log (source, status, records_processed, error_message, started_at, completed_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                """,
                source, status, records, error
            )
        await pool.close()

# Singleton instance
crypto_collector = CryptoCollector()
