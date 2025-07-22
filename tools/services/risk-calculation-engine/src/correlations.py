import numpy as np
import yfinance as yf # Using yfinance for demonstration purposes to fetch example data

class CorrelationCalculator:
    """
    A class to calculate correlations between the returns of multiple financial assets.
    """

    def __init__(self):
        pass # No specific initialization needed for fixed parameters yet

    def _validate_price_data(self, price_data: dict[str, list[float]]):
        """
        Validates the structure of the input price data.
        Ensures all lists are non-empty and contains floats/ints.
        """
        if not isinstance(price_data, dict):
            raise ValueError("Price data must be a dictionary.")
        if not price_data:
            raise ValueError("Price data dictionary cannot be empty.")
        
        for ticker, prices in price_data.items():
            if not isinstance(ticker, str) or not ticker:
                raise ValueError("Asset tickers must be non-empty strings.")
            if not isinstance(prices, list) or not prices:
                raise ValueError(f"Price list for {ticker} cannot be empty or non-list type.")
            if not all(isinstance(p, (int, float)) for p in prices):
                raise ValueError(f"All prices for {ticker} must be numbers.")
            if len(prices) < 2:
                raise ValueError(f"Not enough price data for {ticker} to calculate returns (need at least 2 points).")

    def calculate_returns(self, price_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculates daily percentage returns from a DataFrame of historical prices.

        Args:
            price_df (pd.DataFrame): DataFrame where columns are asset tickers
                                     and index is datetime, containing historical prices.

        Returns:
            pd.DataFrame: DataFrame where columns are asset tickers and index is datetime,
                          containing daily percentage returns.
        """
        if not isinstance(price_df, pd.DataFrame) or price_df.empty:
            raise ValueError("Input price_df must be a non-empty Pandas DataFrame.")
        
        # Calculate percentage change: (Price_today - Price_yesterday) / Price_yesterday
        # .pct_change() is ideal for this. It will result in NaN for the first row of each column.
        returns_df = price_df.pct_change()
        
        # Drop the first row which will contain NaNs (no prior day to calculate return)
        returns_df = returns_df.dropna()

        if returns_df.empty:
            raise ValueError("Not enough valid price data after calculating returns. Ensure at least 2 price points per asset.")
            
        return returns_df

    def calculate_correlation_matrix(self, returns_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculates the correlation matrix from a DataFrame of asset returns.

        Args:
            returns_df (pd.DataFrame): DataFrame where columns are asset tickers
                                       and index is datetime, containing asset returns.

        Returns:
            pd.DataFrame: A symmetrical correlation matrix.
        """
        if not isinstance(returns_df, pd.DataFrame) or returns_df.empty:
            raise ValueError("Input returns_df must be a non-empty Pandas DataFrame.")
        
        # Calculate the pairwise correlation
        correlation_matrix = returns_df.corr()
        
        # Handle cases where correlation cannot be computed (e.g., constant returns)
        correlation_matrix = correlation_matrix.fillna(0) # Or another suitable value like NaN, depending on desired behavior

        return correlation_matrix

    def get_correlations(self, historical_price_data: dict[str, list[float]]) -> dict:
        """
        Main method to get correlations. Takes raw price data, calculates returns,
        and then computes the correlation matrix.

        Args:
            historical_price_data (dict[str, list[float]]): A dictionary where keys are
                asset tickers (e.g., 'AAPL', 'MSFT') and values are lists of historical
                closing prices, ordered from oldest to newest.

        Returns:
            dict: A dictionary containing the correlation matrix.
                  The correlation matrix will be converted to a dictionary for JSON serialization.
        """
        self._validate_price_data(historical_price_data)

        # Convert the dictionary of lists to a Pandas DataFrame
        # For simplicity, we assume prices are already aligned by implied date order.
        # In a real scenario, you'd want to pass dates along with prices.
        # Example if you had dates: pd.DataFrame(data=price_dict, index=dates)
        price_df = pd.DataFrame(historical_price_data)
        
        # Calculate returns
        returns_df = self.calculate_returns(price_df)
        
        # Calculate correlation matrix
        correlation_matrix = self.calculate_correlation_matrix(returns_df)
        
        # Convert the correlation matrix DataFrame to a dictionary for API response
        # .to_dict('index') or .to_dict('records') are common. 'index' gives {row_label: {col_label: value}}
        return correlation_matrix.to_dict(orient='index')

def fetch_example_data(tickers: list[str], period: str = "1y") -> dict[str, list[float]]:
    """
    Fetches historical closing prices for given tickers using yfinance.
    This is for demonstration/testing purposes.
    """
    data = yf.download(tickers, period=period)['Adj Close']
    
    # Drop rows with any NaN values to ensure alignment for correlation
    data = data.dropna() 

    if data.empty:
        raise ValueError(f"No valid data fetched for tickers: {tickers} over period: {period}. Check tickers or period.")

    # Convert DataFrame columns to lists and then to a dictionary
    price_data = {col: data[col].tolist() for col in data.columns}
    return price_data

if __name__ == "__main__":
    calculator = CorrelationCalculator()

    # --- Example 1: Calculating correlations for a few tech stocks ---
    print("--- Example 1: Tech Stock Correlations (1 year data) ---")
    try:
        tech_tickers = ['AAPL', 'MSFT', 'GOOGL', 'NVDA']
        tech_prices = fetch_example_data(tech_tickers, period="1y")
        
        # Convert prices to DataFrame for internal methods, but get_correlations handles dict directly
        # price_df_tech = pd.DataFrame(tech_prices)
        # returns_df_tech = calculator.calculate_returns(price_df_tech)
        # corr_matrix_tech = calculator.calculate_correlation_matrix(returns_df_tech)
        
        # Using the main public method
        corr_matrix_tech_dict = calculator.get_correlations(tech_prices)
        
        print("Correlation Matrix:")
        for row_ticker, correlations in corr_matrix_tech_dict.items():
            print(f"  {row_ticker}:")
            for col_ticker, correlation_value in correlations.items():
                print(f"    {col_ticker}: {correlation_value:.4f}")
        
    except Exception as e:
        print(f"Error in Example 1: {e}")
    print("-" * 50)

    # --- Example 2: Calculating correlations for diversified assets ---
    print("--- Example 2: Diversified Asset Correlations (5 years data) ---")
    try:
        diversified_tickers = ['SPY', 'GLD', 'BND', 'BTC-USD'] # S&P 500 ETF, Gold ETF, Bond ETF, Bitcoin
        diversified_prices = fetch_example_data(diversified_tickers, period="5y")
        
        corr_matrix_diversified_dict = calculator.get_correlations(diversified_prices)

        print("Correlation Matrix:")
        for row_ticker, correlations in corr_matrix_diversified_dict.items():
            print(f"  {row_ticker}:")
            for col_ticker, correlation_value in correlations.items():
                print(f"    {col_ticker}: {correlation_value:.4f}")

    except Exception as e:
        print(f"Error in Example 2: {e}")
    print("-" * 50)

    # --- Example 3: Error handling for insufficient data ---
    print("--- Example 3: Error for Insufficient Data ---")
    try:
        single_day_prices = {'AAPL': [100.0]}
        calculator.get_correlations(single_day_prices)
    except ValueError as e:
        print(f"Expected Error: {e}")
    print("-" * 50)

    print("--- Example 4: Error for Invalid Input Type ---")
    try:
        invalid_prices = "not a dict"
        calculator.get_correlations(invalid_prices)
    except ValueError as e:
        print(f"Expected Error: {e}")
    print("-" * 50)

