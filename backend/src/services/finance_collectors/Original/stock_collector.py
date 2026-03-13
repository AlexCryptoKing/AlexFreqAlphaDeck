"""
Stock data collector for MultibotdashboardV7
Fetches data from Yahoo Finance / Finviz
"""

import asyncio
import aiohttp
import asyncpg
from datetime import datetime
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Default stocks to track
DEFAULT_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
    'NVDA', 'META', 'NFLX', 'AMD', 'INTC'
]

class StockCollector:
    """Collects stock market data."""
    
    def __init__(self):
        self.db_config = {
            'host': '192.168.0.210',
            'port': 5432,
            'user': 'dashboard',
            'password': 'dashboard',
            'database': 'financial_data'
        }
    
    async def fetch_yahoo_data(self, symbols: List[str]) -> List[Dict]:
        """Fetch stock data from Yahoo Finance."""
        # Using Yahoo Finance query1 API
        url = "https://query1.finance.yahoo.com/v7/finance/quote"
        params = {'symbols': ','.join(symbols)}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    quotes = data.get('quoteResponse', {}).get('result', [])
                    return quotes
                else:
                    logger.error(f"Yahoo Finance API error: {response.status}")
                    return []
    
    def parse_stock_data(self, quote: Dict) -> Dict:
        """Parse Yahoo Finance quote to standardized format."""
        return {
            'symbol': quote.get('symbol'),
            'name': quote.get('longName') or quote.get('shortName', ''),
            'price': quote.get('regularMarketPrice'),
            'change': quote.get('regularMarketChange'),
            'change_percent': quote.get('regularMarketChangePercent'),
            'volume': quote.get('regularMarketVolume'),
            'market_cap': quote.get('marketCap'),
            'pe_ratio': quote.get('trailingPE'),
            'sector': quote.get('sector'),
            'industry': quote.get('industry')
        }
    
    async def save_to_db(self, stocks: List[Dict]):
        """Save stock data to database."""
        pool = await asyncpg.create_pool(**self.db_config)
        
        async with pool.acquire() as conn:
            for stock in stocks:
                if not stock.get('symbol') or not stock.get('price'):
                    continue
                    
                await conn.execute(
                    """
                    INSERT INTO stocks 
                    (symbol, name, price, change, change_percent, volume, market_cap, pe_ratio, sector, industry)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    """,
                    stock['symbol'],
                    stock['name'],
                    stock['price'],
                    stock['change'],
                    stock['change_percent'],
                    stock['volume'],
                    stock['market_cap'],
                    stock['pe_ratio'],
                    stock['sector'],
                    stock['industry']
                )
        
        await pool.close()
        logger.info(f"Saved {len(stocks)} stocks to DB")
    
    async def run(self):
        """Run the collector."""
        try:
            logger.info("Starting stock collection...")
            raw_data = await self.fetch_yahoo_data(DEFAULT_STOCKS)
            if raw_data:
                stocks = [self.parse_stock_data(q) for q in raw_data]
                stocks = [s for s in stocks if s['symbol']]  # Filter valid
                await self.save_to_db(stocks)
                await self._log_sync('stocks', 'success', len(stocks))
            else:
                await self._log_sync('stocks', 'error', 0, 'No data received')
        except Exception as e:
            logger.error(f"Stock collector error: {e}")
            await self._log_sync('stocks', 'error', 0, str(e))
    
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
stock_collector = StockCollector()
