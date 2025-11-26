"""
YFinance tools for fetching stock market data using the yfinance library.
Based on yfinance API: https://ranaroussi.github.io/yfinance/reference/index.html
"""

import yfinance as yf
from google.adk.tools.tool_context import ToolContext
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import pandas as pd


def safe_float(value):
    """
    Safely convert a value to float, returning None if it's NaN, None, or invalid.
    This prevents NaN from appearing in JSON which causes parsing errors.
    """
    if value is None:
        return None
    try:
        float_val = float(value)
        # Check if it's NaN or infinity
        if pd.isna(float_val) or float_val == float('inf') or float_val == float('-inf'):
            return None
        return float_val
    except (ValueError, TypeError):
        return None


def get_stock_price(ticker: str, tool_context: ToolContext) -> Dict[str, Any]:
    """
    Fetches the current stock price and key financial metrics for a given ticker symbol.
    
    This tool uses the yfinance Ticker.info attribute to get real-time data including:
    - Current/regular market price
    - Previous close
    - Day's range (high/low)
    - Market cap
    - Volume
    - 52-week high/low
    
    Args:
        ticker: The stock ticker symbol (e.g., "AAPL" for Apple, "GOOGL" for Alphabet).
        tool_context: The ADK ToolContext object.
    
    Returns:
        A dictionary containing the ticker symbol and comprehensive current price data.
    
    Example:
        {"ticker": "AAPL", "currentPrice": 185.50, "previousClose": 184.20, ...}
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        if not info or len(info) == 0:
            return {
                "ticker": ticker.upper(),
                "error": "No data available for this ticker. Please verify the ticker symbol is correct."
            }
        
        # Extract key price and market data with safe_float to handle NaN
        result = {
            "ticker": ticker.upper(),
            "currentPrice": safe_float(info.get("currentPrice") or info.get("regularMarketPrice")),
            "previousClose": safe_float(info.get("previousClose")),
            "open": safe_float(info.get("regularMarketOpen") or info.get("open")),
            "dayHigh": safe_float(info.get("dayHigh")),
            "dayLow": safe_float(info.get("dayLow")),
            "volume": safe_float(info.get("volume")),
            "marketCap": safe_float(info.get("marketCap")),
            "fiftyTwoWeekHigh": safe_float(info.get("fiftyTwoWeekHigh")),
            "fiftyTwoWeekLow": safe_float(info.get("fiftyTwoWeekLow")),
            "currency": info.get("currency", "USD"),
            "exchange": info.get("exchange"),
            "longName": info.get("longName") or info.get("shortName"),
        }
        
        # Remove None values to keep response clean
        result = {k: v for k, v in result.items() if v is not None}
        
        if len(result) <= 1:  # Only ticker, no actual data
            return {
                "ticker": ticker.upper(),
                "error": "No valid price data available for this ticker"
            }
        
        return result
    except Exception as e:
        return {"ticker": ticker.upper(), "error": f"Failed to fetch stock price: {str(e)}"}


def get_historical_data(
    ticker: str, 
    period: str = "1mo",
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    tool_context: ToolContext = None
) -> Dict[str, Any]:
    """
    Fetches historical stock data for a given ticker symbol.
    
    Uses yfinance Ticker.history() method to retrieve historical market data.
    Can specify either a period (e.g., "1mo", "1y") or specific start/end dates.
    
    Args:
        ticker: The stock ticker symbol.
        period: Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
                Only used if start_date and end_date are not provided.
        start_date: The start date in "YYYY-MM-DD" format (optional).
        end_date: The end date in "YYYY-MM-DD" format (optional).
        tool_context: The ADK ToolContext object.
    
    Returns:
        A dictionary containing historical OHLCV (Open, High, Low, Close, Volume) data.
    
    Example:
        {
            "ticker": "AAPL",
            "period": "1mo",
            "data": [
                {"date": "2024-01-15", "open": 185.0, "high": 187.5, "low": 184.0, "close": 186.5, "volume": 52300000},
                ...
            ]
        }
    """
    try:
        stock = yf.Ticker(ticker)
        
        # Fetch historical data
        if start_date and end_date:
            hist = stock.history(start=start_date, end=end_date)
            period_used = f"{start_date} to {end_date}"
        else:
            hist = stock.history(period=period)
            period_used = period
        
        if hist.empty:
            return {
                "ticker": ticker.upper(),
                "error": "No historical data available for the specified period"
            }
        
        # Convert DataFrame to list of dicts with date as string
        # Filter out NaN and invalid values
        hist_data = []
        for date, row in hist.iterrows():
            # Check if any values are NaN or infinity
            if (pd.notna(row['Open']) and pd.notna(row['High']) and 
                pd.notna(row['Low']) and pd.notna(row['Close']) and 
                pd.notna(row['Volume'])):
                try:
                    hist_data.append({
                        "date": date.strftime("%Y-%m-%d"),
                        "open": round(float(row['Open']), 2),
                        "high": round(float(row['High']), 2),
                        "low": round(float(row['Low']), 2),
                        "close": round(float(row['Close']), 2),
                        "volume": int(row['Volume'])
                    })
                except (ValueError, TypeError) as e:
                    # Skip this row if conversion fails
                    continue
        
        if not hist_data:
            return {
                "ticker": ticker.upper(),
                "error": "No valid historical data points found (all values were NaN or invalid)"
            }
        
        return {
            "ticker": ticker.upper(),
            "period": period_used,
            "dataPoints": len(hist_data),
            "data": hist_data
        }
    except Exception as e:
        return {"ticker": ticker.upper(), "error": f"Failed to fetch historical data: {str(e)}"}


def get_financial_info(ticker: str, tool_context: ToolContext) -> Dict[str, Any]:
    """
    Fetches comprehensive financial information for a given ticker.
    
    Uses yfinance Ticker.info to get detailed company and financial data including:
    - Company information (sector, industry, description)
    - Financial metrics (P/E ratio, EPS, revenue, profit margins)
    - Analyst recommendations
    - Dividend information
    
    Args:
        ticker: The stock ticker symbol.
        tool_context: The ADK ToolContext object.
    
    Returns:
        A dictionary containing comprehensive financial information.
    
    Example:
        {
            "ticker": "AAPL",
            "companyName": "Apple Inc.",
            "sector": "Technology",
            "trailingPE": 28.5,
            "eps": 6.52,
            ...
        }
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        result = {
            "ticker": ticker.upper(),
            # Company Info
            "companyName": info.get("longName") or info.get("shortName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "website": info.get("website"),
            "description": info.get("longBusinessSummary"),
            "country": info.get("country"),
            "employees": info.get("fullTimeEmployees"),
            
            # Financial Metrics
            "marketCap": safe_float(info.get("marketCap")),
            "trailingPE": safe_float(info.get("trailingPE")),
            "forwardPE": safe_float(info.get("forwardPE")),
            "priceToBook": safe_float(info.get("priceToBook")),
            "earningsPerShare": safe_float(info.get("trailingEps")),
            "revenuePerShare": safe_float(info.get("revenuePerShare")),
            "profitMargins": safe_float(info.get("profitMargins")),
            "operatingMargins": safe_float(info.get("operatingMargins")),
            
            # Revenue & Earnings
            "totalRevenue": safe_float(info.get("totalRevenue")),
            "revenueGrowth": safe_float(info.get("revenueGrowth")),
            "earningsGrowth": safe_float(info.get("earningsGrowth")),
            
            # Analyst Data
            "targetMeanPrice": safe_float(info.get("targetMeanPrice")),
            "targetHighPrice": safe_float(info.get("targetHighPrice")),
            "targetLowPrice": safe_float(info.get("targetLowPrice")),
            "recommendationKey": info.get("recommendationKey"),
            "numberOfAnalystOpinions": safe_float(info.get("numberOfAnalystOpinions")),
            
            # Dividend Info
            "dividendRate": safe_float(info.get("dividendRate")),
            "dividendYield": safe_float(info.get("dividendYield")),
            "payoutRatio": safe_float(info.get("payoutRatio")),
            "exDividendDate": info.get("exDividendDate"),
            
            # Trading Info
            "beta": safe_float(info.get("beta")),
            "averageVolume": safe_float(info.get("averageVolume")),
            "averageVolume10days": safe_float(info.get("averageVolume10days")),
        }
        
        # Remove None values
        result = {k: v for k, v in result.items() if v is not None}
        
        return result
    except Exception as e:
        return {"ticker": ticker.upper(), "error": f"Failed to fetch financial info: {str(e)}"}


def get_earnings_dates(ticker: str, tool_context: ToolContext) -> Dict[str, Any]:
    """
    Fetches upcoming and historical earnings dates for a ticker.
    
    Uses yfinance Ticker.earnings_dates attribute to get earnings calendar data.
    
    Args:
        ticker: The stock ticker symbol.
        tool_context: The ADK ToolContext object.
    
    Returns:
        A dictionary containing earnings dates and estimates.
    
    Example:
        {
            "ticker": "AAPL",
            "upcomingEarningsDate": "2024-02-01",
            "data": [{"date": "2024-02-01", "epsEstimate": 2.10, ...}, ...]
        }
    """
    try:
        stock = yf.Ticker(ticker)
        earnings_dates = stock.earnings_dates
        
        if earnings_dates is None or earnings_dates.empty:
            return {
                "ticker": ticker.upper(),
                "message": "No earnings dates available"
            }
        
        # Convert to list of dicts
        earnings_list = []
        for date, row in earnings_dates.iterrows():
            earnings_list.append({
                "date": date.strftime("%Y-%m-%d"),
                "epsEstimate": float(row.get('EPS Estimate', 0)) if pd.notna(row.get('EPS Estimate')) else None,
                "reportedEPS": float(row.get('Reported EPS', 0)) if pd.notna(row.get('Reported EPS')) else None,
                "surprise": float(row.get('Surprise(%)', 0)) if pd.notna(row.get('Surprise(%)')) else None,
            })
        
        # Get next earnings date (first future date or most recent)
        upcoming = None
        today = datetime.now()
        for item in earnings_list:
            item_date = datetime.strptime(item['date'], "%Y-%m-%d")
            if item_date >= today:
                upcoming = item['date']
                break
        
        return {
            "ticker": ticker.upper(),
            "upcomingEarningsDate": upcoming,
            "data": earnings_list[:10]  # Limit to 10 most recent/upcoming
        }
    except Exception as e:
        return {"ticker": ticker.upper(), "error": f"Failed to fetch earnings dates: {str(e)}"}


def get_analyst_recommendations(ticker: str, tool_context: ToolContext) -> Dict[str, Any]:
    """
    Fetches recent analyst recommendations and upgrades/downgrades.
    
    Uses yfinance Ticker.recommendations attribute to get analyst rating changes.
    
    Args:
        ticker: The stock ticker symbol.
        tool_context: The ADK ToolContext object.
    
    Returns:
        A dictionary containing recent analyst recommendations.
    
    Example:
        {
            "ticker": "AAPL",
            "data": [
                {"date": "2024-01-15", "firm": "Morgan Stanley", "action": "up", "from": "hold", "to": "buy"},
                ...
            ]
        }
    """
    try:
        stock = yf.Ticker(ticker)
        recommendations = stock.recommendations
        
        if recommendations is None or recommendations.empty:
            # Try to get from info
            info = stock.info
            recommendation_key = info.get("recommendationKey")
            if recommendation_key:
                return {
                    "ticker": ticker.upper(),
                    "currentRecommendation": recommendation_key,
                    "message": "Detailed recommendations history not available"
                }
            return {
                "ticker": ticker.upper(),
                "message": "No analyst recommendations available"
            }
        
        # Get recent recommendations (last 20)
        recent = recommendations.tail(20)
        
        recs_list = []
        for date, row in recent.iterrows():
            recs_list.append({
                "date": date.strftime("%Y-%m-%d") if hasattr(date, 'strftime') else str(date),
                "firm": str(row.get('Firm', '')),
                "toGrade": str(row.get('To Grade', '')),
                "fromGrade": str(row.get('From Grade', '')) if pd.notna(row.get('From Grade')) else None,
                "action": str(row.get('Action', '')) if pd.notna(row.get('Action')) else None,
            })
        
        return {
            "ticker": ticker.upper(),
            "totalRecommendations": len(recs_list),
            "data": recs_list
        }
    except Exception as e:
        return {"ticker": ticker.upper(), "error": f"Failed to fetch analyst recommendations: {str(e)}"}