from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from .portfolio_simulator import PortfolioSimulator # Import the simulator we just created
from .risk_assessment_engine import RiskAssessmentEngine, RiskFactors
import numpy as np # Used for potential numpy array to list conversion

app = FastAPI(
    title="Portfolio Simulation Engine",
    description="API for running Monte Carlo simulations on investment portfolios.",
    version="0.1.0"
)

# Initialize the portfolio simulator
simulator = PortfolioSimulator()

class SimulationInput(BaseModel):
    """
    Input model for the portfolio simulation endpoint.
    """
    initial_investment: float = Field(..., description="Starting portfolio value (USD).", ge=0)
    monthly_contribution: float = Field(..., description="Amount added monthly (USD).", ge=0)
    num_simulations: int = Field(..., description="Number of Monte Carlo simulation paths.", ge=1)
    simulation_years: int = Field(..., description="Duration of simulation in years.", ge=1)
    portfolio_annual_return: float = Field(..., description="Expected annual return of the portfolio (%).", ge=-100) # Can be negative, but bounded
    portfolio_annual_volatility: float = Field(..., description="Annual volatility (standard deviation) of the portfolio (%).", ge=0)

class SimulationOutput(BaseModel):
    """
    Output model for the portfolio simulation endpoint.
    """
    # final_portfolio_values: list[float] = Field(..., description="List of final portfolio values from all simulations.")
    mean_final_value: float = Field(..., description="Average of all final portfolio values.")
    median_final_value: float = Field(..., description="Median of all final portfolio values (50th percentile).")
    std_dev_final_value: float = Field(..., description="Standard deviation of final portfolio values.")
    percentiles: dict[str, float] = Field(..., description="Dictionary with 10th, 50th, and 90th percentile values.")
    # For a web application, returning all final_portfolio_values might be too much data for large simulations.
    # We might only need the summarized percentiles for charting.

@app.post("/simulate-portfolio", response_model=SimulationOutput, summary="Run Portfolio Monte Carlo Simulation")
async def simulate_portfolio(input_data: SimulationInput):
    """
    Runs a Monte Carlo simulation to project potential portfolio growth over time.

    - **initial_investment**: The starting amount in the portfolio.
    - **monthly_contribution**: Regular additional investments per month.
    - **num_simulations**: How many unique future scenarios to simulate.
    - **simulation_years**: The total length of the simulation in years.
    - **portfolio_annual_return**: The expected average yearly return (e.g., 7 for 7%).
    - **portfolio_annual_volatility**: The expected yearly fluctuation/risk (e.g., 10 for 10%).

    Returns key statistics about the simulated final portfolio values, including mean, median,
    and specific percentiles (10th, 50th, 90th) to show potential range of outcomes.
    """
    try:
        # Call the simulation engine with the Pydantic model data
        result = simulator.run_monte_carlo_simulation(
            initial_investment=input_data.initial_investment,
            monthly_contribution=input_data.monthly_contribution,
            num_simulations=input_data.num_simulations,
            simulation_years=input_data.simulation_years,
            portfolio_annual_return=input_data.portfolio_annual_return,
            portfolio_annual_volatility=input_data.portfolio_annual_volatility
        )
        
        # Remove 'final_portfolio_values' from result if it's too large for direct API response
        # It's better to just send the summarized statistics for typical API use.
        result.pop('final_portfolio_values', None) # Remove it if it exists

        return SimulationOutput(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

# Additional endpoints could be added, e.g., for backtesting or more complex scenario analysis.

class RiskAssessmentInput(BaseModel):
    income: float
    expenses: float
    assets: float
    liabilities: float
    credit_score: int
    investment_experience: int
    risk_tolerance: int
    market_volatility: float
    industry_risk: float
    economic_outlook: float
    age: int
    dependents: int
    gender: str
    is_immigrant: bool
    is_retired: bool
    employment_status: str
    education_level: str
    marital_status: str
    region: str

class RiskAssessmentOutput(BaseModel):
    risk_score: float
    risk_label: str
    recommended_allocation: dict

risk_engine = RiskAssessmentEngine()

@app.post("/assess-risk", response_model=RiskAssessmentOutput, summary="Assess risk profile and recommend allocation")
async def assess_risk(input_data: RiskAssessmentInput):
    try:
        factors = RiskFactors(**input_data.dict())
        result = risk_engine.assess_risk(factors)
        return RiskAssessmentOutput(
            risk_score=result['risk_score'],
            risk_label=result['risk_label'],
            recommended_allocation=result['recommended_allocation']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

