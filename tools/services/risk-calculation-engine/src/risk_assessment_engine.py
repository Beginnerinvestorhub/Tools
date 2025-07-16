import json
import logging
import time
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, field

import pandas as pd
import requests
from sklearn.linear_model import LinearRegression

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RiskFactors:
    income: float = 0.0
    expenses: float = 0.0
    assets: float = 0.0
    liabilities: float = 0.0
    credit_score: int = 0
    investment_experience: int = 0
    risk_tolerance: int = 5
    market_volatility: float = 0.0
    industry_risk: float = 0.0
    economic_outlook: float = 0.0
    age: int = 30
    dependents: int = 0
    gender: str = "unspecified"
    is_immigrant: bool = False
    is_retired: bool = False
    employment_status: str = "employed"
    education_level: str = "high_school"
    marital_status: str = "single"
    region: str = "us"

@dataclass
class RiskAssessmentEngine:
    weights: Dict[str, float] = field(default_factory=lambda: {
        'income': 0.1,
        'expenses': -0.1,
        'assets': 0.15,
        'liabilities': -0.15,
        'credit_score': 0.2,
        'investment_experience': 0.1,
        'risk_tolerance': 0.1,
        'market_volatility': -0.05,
        'industry_risk': -0.05,
        'economic_outlook': 0.1,
        'age': 0.05,
        'dependents': -0.05,
        'is_immigrant': -0.05,
        'is_retired': -0.05,
        'employment_status_score': 0.05,
        'education_level_score': 0.05,
        'marital_status_score': 0.05,
        'region_modifier': 0.1
    })

    def fetch_gdp_and_inflation(self, region_code: str) -> Dict[str, float]:
        base_url = "https://api.worldbank.org/v2/country/{}/indicator/{}?format=json"
        indicators = {
            'gdp': 'NY.GDP.MKTP.CD',
            'inflation': 'FP.CPI.TOTL.ZG'
        }
        results = {}
        for key, ind in indicators.items():
            try:
                url = base_url.format(region_code, ind)
                response = requests.get(url)
                data = response.json()
                latest = next((e for e in data[1] if e['value'] is not None), None)
                results[key] = latest['value'] if latest else 0.0
            except Exception as e:
                logger.warning(f"Failed to fetch {key} for {region_code}: {e}")
                results[key] = 0.0
        return results

    def compute_region_modifier(self, region: str) -> float:
        metrics = self.fetch_gdp_and_inflation(region)
        gdp = metrics.get('gdp', 0)
        inflation = metrics.get('inflation', 0)
        gdp_score = min(gdp / 1e13, 0.1)
        inflation_penalty = max(min(inflation / 10, 0.1), 0)
        return max(min(1.0 + gdp_score - inflation_penalty, 1.2), 0.7)

    def score(self, data: RiskFactors, explain: bool = False) -> float:
        normalized = self._normalize_data(data)
        weighted_factors = {k: normalized[k] * self.weights.get(k, 0) for k in self.weights}
        score = sum(weighted_factors.values())
        return score

    def classify(self, score: float) -> str:
        if score < 0.3:
            return "High Risk"
        elif score < 0.6:
            return "Moderate Risk"
        return "Low Risk"

    def _normalize_data(self, data: RiskFactors) -> Dict[str, float]:
        return {
            'income': min(data.income / 100000, 1.0),
            'expenses': min(data.expenses / 100000, 1.0),
            'assets': min(data.assets / 1000000, 1.0),
            'liabilities': min(data.liabilities / 1000000, 1.0),
            'credit_score': data.credit_score / 850,
            'investment_experience': min(data.investment_experience / 20, 1.0),
            'risk_tolerance': data.risk_tolerance / 10,
            'market_volatility': data.market_volatility / 100,
            'industry_risk': data.industry_risk / 100,
            'economic_outlook': data.economic_outlook / 100,
            'age': min(data.age / 100, 1.0),
            'dependents': min(data.dependents / 10, 1.0),
            'is_immigrant': 1.0 if data.is_immigrant else 0.0,
            'is_retired': 1.0 if data.is_retired else 0.0,
            'employment_status_score': self._employment_score(data.employment_status),
            'education_level_score': self._education_score(data.education_level),
            'marital_status_score': self._marital_score(data.marital_status),
            'region_modifier': self.compute_region_modifier(data.region)
        }

    def _employment_score(self, status: str) -> float:
        mapping = {
            'employed': 1.0,
            'self-employed': 0.8,
            'student': 0.5,
            'retired': 0.3,
            'unemployed': 0.0
        }
        return mapping.get(status, 0.5)

    def _education_score(self, level: str) -> float:
        mapping = {
            'high_school': 0.4,
            'associate': 0.5,
            'bachelor': 0.7,
            'master': 0.85,
            'doctorate': 1.0
        }
        return mapping.get(level, 0.5)

    def _marital_score(self, status: str) -> float:
        mapping = {
            'single': 0.5,
            'married': 0.7,
            'divorced': 0.4,
            'widowed': 0.6
        }
        return mapping.get(status, 0.5)

    def from_dict(self, input_dict: Dict[str, Any]) -> RiskFactors:
        return RiskFactors(**input_dict)

    def from_json(self, json_str: str) -> RiskFactors:
        return self.from_dict(json.loads(json_str))

    def from_dataframe(self, df: pd.DataFrame, row: int = 0) -> RiskFactors:
        row_data = df.iloc[row].to_dict()
        return self.from_dict(row_data)

    def export_result(self, score: float, classification: str, fmt: str = 'json') -> str:
        result = {"score": round(score, 2), "classification": classification}
        if fmt == 'json':
            return json.dumps(result)
        elif fmt == 'csv':
            return f"score,classification\n{result['score']},{result['classification']}"
        return str(result)

    def save_result_to_file(self, result: Dict[str, Any], filepath: str, fmt: str = 'json') -> None:
        if fmt == 'json':
            with open(filepath, 'w') as f:
                json.dump(result, f, indent=2)
        elif fmt == 'csv':
            pd.DataFrame([result]).to_csv(filepath, index=False)

    def profile(self, data: RiskFactors) -> Dict[str, Any]:
        normalized = self._normalize_data(data)
        weighted = {k: round(normalized[k] * self.weights.get(k, 0), 4) for k in self.weights}
        score = sum(weighted.values())
        return {
            "score": round(score, 2),
            "classification": self.classify(score),
            "contributions": weighted,
            "raw_input": data.__dict__,
        }

    def batch_score(self, df: pd.DataFrame) -> pd.DataFrame:
        results = []
        for _, row in df.iterrows():
            rf = self.from_dict(row.to_dict())
            profile = self.profile(rf)
            results.append(profile)
        return pd.DataFrame(results)

    def sensitivity_analysis(self, data: RiskFactors) -> Dict[str, float]:
        baseline = self.score(data)
        analysis = {}
        for field in data.__dataclass_fields__:
            original = getattr(data, field)
            try:
                if isinstance(original, bool):
                    setattr(data, field, not original)
                elif isinstance(original, (int, float)):
                    setattr(data, field, original * 1.1)
                score = self.score(data)
                analysis[field] = round(score - baseline, 4)
                setattr(data, field, original)
            except Exception:
                setattr(data, field, original)
        return analysis

    def auto_tune_weights(self, training_data: List[Tuple[RiskFactors, float]]) -> None:
        X = []
        y = []
        for factors, actual_score in training_data:
            normalized = self._normalize_data(factors)
            X.append([normalized[k] for k in self.weights.keys()])
            y.append(actual_score)
        model = LinearRegression()
        model.fit(X, y)
        tuned_weights = dict(zip(self.weights.keys(), model.coef_))
        self.weights.update(tuned_weights)

if __name__ == '__main__':
    engine = RiskAssessmentEngine()
    input_data = RiskFactors(
        income=75000, expenses=30000, assets=150000, liabilities=50000,
        credit_score=720, investment_experience=5, risk_tolerance=7,
        market_volatility=20, industry_risk=15, economic_outlook=60,
        age=35, dependents=2, gender="male", is_immigrant=True, is_retired=False,
        employment_status="employed", education_level="bachelor", marital_status="married",
        region="US"
    )
    result = engine.profile(input_data)
    print(json.dumps(result, indent=2))
    engine.save_result_to_file(result, "risk_result.json")
    print("Sensitivity:", json.dumps(engine.sensitivity_analysis(input_data), indent=2))
