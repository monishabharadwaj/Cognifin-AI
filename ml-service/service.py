from __future__ import annotations

"""
Thin service layer for backend API integration.

The backend can import `run_anomaly_check` and call it from a FastAPI/Flask
endpoint without needing to know about individual models.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from anomaly_engine import AnomalyEngine, AnomalyEngineError


_ENGINE: Optional[AnomalyEngine] = None


def _get_engine() -> AnomalyEngine:
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = AnomalyEngine()
    return _ENGINE


@dataclass
class AnomalyRequest:
    user_id: Any
    amount: float
    recent_sequence: List[float]


def run_anomaly_check(request: AnomalyRequest) -> Dict[str, Any]:
    """
    Entry point for the backend API.

    Args:
        request: AnomalyRequest with user_id, transaction amount, and recent sequence.

    Returns:
        Dictionary containing anomaly scores and risk_level, suitable for JSON response.
    """
    engine = _get_engine()

    try:
        result = engine.analyze_transaction(
            transaction_amount=request.amount,
            sequence=request.recent_sequence,
        )
        # Attach user identifier for downstream correlation
        result["user_id"] = request.user_id
        return result
    except AnomalyEngineError:
        # Let the API layer map this to an HTTP 500 or 503 with a safe message.
        raise

