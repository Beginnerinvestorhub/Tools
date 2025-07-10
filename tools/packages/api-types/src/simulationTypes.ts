// Simulation types for risk engine endpoints

export interface PortfolioSimulationRequest {
  initialInvestment: number;
  assets: {
    symbol: string;
    allocation: number; // percent or absolute value
  }[];
  simulationPeriod: number; // in years
}

export interface PortfolioSimulationResult {
  finalValue: number;
  annualReturns: number[];
  risk: number;
  details?: any;
}

// Common API error class for backend
export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
