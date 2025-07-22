import numpy as np

class PortfolioSimulator:
    """
    A class to perform Monte Carlo simulations for investment portfolios.
    """

    def __init__(self):
        pass # No specific initialization needed for fixed parameters yet

    def run_monte_carlo_simulation(self,
                                   initial_investment: float,
                                   monthly_contribution: float,
                                   num_simulations: int,
                                   simulation_years: int,
                                   portfolio_annual_return: float, # Expected annual return in percentage (e.g., 7 for 7%)
                                   portfolio_annual_volatility: float # Annual standard deviation in percentage (e.g., 10 for 10%)
                                   ) -> dict:
        """
        Runs a Monte Carlo simulation for a portfolio.

        Args:
            initial_investment (float): The starting amount of money in the portfolio.
            monthly_contribution (float): The amount added to the portfolio each month.
            num_simulations (int): The number of independent simulation paths to run.
            simulation_years (int): The duration of each simulation in years.
            portfolio_annual_return (float): The expected average annual return of the portfolio (e.g., 7 for 7%).
            portfolio_annual_volatility (float): The expected annual standard deviation of returns (e.g., 10 for 10%).

        Returns:
            dict: A dictionary containing simulation results:
                  - 'final_portfolio_values': A list of the final value for each simulation.
                  - 'mean_final_value': The average of all final portfolio values.
                  - 'median_final_value': The median of all final portfolio values (50th percentile).
                  - 'std_dev_final_value': The standard deviation of final portfolio values.
                  - 'percentiles': A dictionary with 10th, 50th, and 90th percentile values.
        """

        if not all(isinstance(arg, (int, float)) for arg in [initial_investment, monthly_contribution, portfolio_annual_return, portfolio_annual_volatility]):
            raise ValueError("Initial investment, monthly contribution, annual return, and volatility must be numeric.")
        if not all(isinstance(arg, int) for arg in [num_simulations, simulation_years]):
            raise ValueError("Number of simulations and simulation years must be integers.")
        
        if initial_investment < 0 or monthly_contribution < 0:
            raise ValueError("Initial investment and monthly contribution cannot be negative.")
        if num_simulations <= 0 or simulation_years <= 0:
            raise ValueError("Number of simulations and simulation years must be positive.")
        if portfolio_annual_volatility < 0:
            raise ValueError("Portfolio annual volatility cannot be negative.")

        # Convert annual return and volatility to monthly
        # E.g., 7% annual return -> 0.07 annual return factor
        # Monthly return factor = (1 + annual return factor)^(1/12) - 1
        # For simplicity, using simple division for now, but geometric is more accurate for long term.
        # More robust: annual_return_factor = 1 + portfolio_annual_return / 100
        # monthly_return = (annual_return_factor**(1/12)) - 1
        # monthly_std_dev = portfolio_annual_volatility / 100 / np.sqrt(12)

        # Assuming returns are normally distributed on an annual basis and then scaled to monthly
        # Annual return % to decimal
        annual_return_decimal = portfolio_annual_return / 100
        annual_volatility_decimal = portfolio_annual_volatility / 100

        # Calculate monthly average return and standard deviation for the normal distribution
        # Using a more common approximation for monthly values from annual
        monthly_average_return = annual_return_decimal / 12
        monthly_std_dev = annual_volatility_decimal / np.sqrt(12)

        num_months = simulation_years * 12
        final_portfolio_values = []

        for _ in range(num_simulations):
            portfolio_value = initial_investment
            for month in range(num_months):
                # Generate a random monthly return from a normal distribution
                # The mean is the monthly average return, std dev is monthly std dev
                monthly_return = np.random.normal(monthly_average_return, monthly_std_dev)
                
                # Apply return to current portfolio value
                portfolio_value *= (1 + monthly_return)
                
                # Add monthly contribution
                portfolio_value += monthly_contribution
            
            final_portfolio_values.append(portfolio_value)
        
        # Convert to numpy array for easier statistical calculations
        final_portfolio_values = np.array(final_portfolio_values)

        # Calculate statistics
        mean_final_value = np.mean(final_portfolio_values)
        median_final_value = np.median(final_portfolio_values)
        std_dev_final_value = np.std(final_portfolio_values)

        # Calculate percentiles (e.g., 10th percentile for "bad" outcome, 90th for "good" outcome)
        p10 = np.percentile(final_portfolio_values, 10)
        p50 = np.percentile(final_portfolio_values, 50)
        p90 = np.percentile(final_portfolio_values, 90)

        return {
            "final_portfolio_values": final_portfolio_values.tolist(), # Convert numpy array to list for JSON serialization
            "mean_final_value": mean_final_value,
            "median_final_value": median_final_value,
            "std_dev_final_value": std_dev_final_value,
            "percentiles": {
                "10th": p10,
                "50th": p50,
                "90th": p90
            }
        }

if __name__ == "__main__":
    # Example Usage:
    simulator = PortfolioSimulator()

    print("Running Monte Carlo Simulation for a growth portfolio...")
    results = simulator.run_monte_carlo_simulation(
        initial_investment=10000,
        monthly_contribution=100,
        num_simulations=1000,
        simulation_years=20,
        portfolio_annual_return=8,   # 8% annual return
        portfolio_annual_volatility=15 # 15% annual volatility
    )

    print("\n--- Simulation Results ---")
    print(f"Mean Final Portfolio Value: ${results['mean_final_value']:.2f}")
    print(f"Median Final Portfolio Value (50th percentile): ${results['median_final_value']:.2f}")
    print(f"Standard Deviation of Final Values: ${results['std_dev_final_value']:.2f}")
    print("\nPercentiles:")
    print(f"  10th Percentile (Worst 10% Outcome): ${results['percentiles']['10th']:.2f}")
    print(f"  50th Percentile (Median Outcome): ${results['percentiles']['50th']:.2f}")
    print(f"  90th Percentile (Best 10% Outcome): ${results['percentiles']['90th']:.2f}")

    print("\n--------------------------")

    print("Running Monte Carlo Simulation for a conservative portfolio...")
    results_conservative = simulator.run_monte_carlo_simulation(
        initial_investment=50000,
        monthly_contribution=500,
        num_simulations=500,
        simulation_years=10,
        portfolio_annual_return=4,   # 4% annual return
        portfolio_annual_volatility=7 # 7% annual volatility
    )

    print("\n--- Conservative Simulation Results ---")
    print(f"Mean Final Portfolio Value: ${results_conservative['mean_final_value']:.2f}")
    print(f"Median Final Portfolio Value (50th percentile): ${results_conservative['median_final_value']:.2f}")
    print("\nPercentiles:")
    print(f"  10th Percentile: ${results_conservative['percentiles']['10th']:.2f}")
    print(f"  90th Percentile: ${results_conservative['percentiles']['90th']:.2f}")
    print("\n--------------------------")

    # Example of invalid input
    try:
        print("\nTesting invalid input (negative initial investment)...")
        simulator.run_monte_carlo_simulation(
            initial_investment=-1000,
            monthly_contribution=100,
            num_simulations=1000,
            simulation_years=20,
            portfolio_annual_return=8,
            portfolio_annual_volatility=15
        )
    except ValueError as e:
        print(f"Error: {e}")
    print("--------------------------")

