export type PortfolioAsset =
  | { symbol: string; allocationType: 'percent'; allocation: number }
  | { symbol: string; allocationType: 'absolute'; allocation: number };

export interface PortfolioSimulationRequest {
  initialInvestment: number;
  assets: PortfolioAsset[];
  simulationPeriod: number;
}

export interface PortfolioSimulationResult {
  finalValue: number;
  annualReturns: number[];
  risk: number;
  details?: any;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
