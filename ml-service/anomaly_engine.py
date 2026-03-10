from __future__ import annotations

from dataclasses import dataclass
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import torch

import predictor
from isolation_detector import IsolationDetector
from autoencoder_detector import AutoencoderDetector, TransactionAutoencoder


@dataclass(frozen=True)
class _LSTMArtifacts:
    model: torch.nn.Module
    scaler: Any


class AnomalyEngineError(RuntimeError):
    """Stable, API-safe error raised by AnomalyEngine."""


class AnomalyEngine:
    """
    Central orchestrator that combines multiple anomaly signals:
    - LSTM predicted spending residual (unexpected deviation vs forecast)
    - Isolation Forest score (statistical outlier indicator)
    - Autoencoder reconstruction error (behavioral pattern anomaly)
    """

    def __init__(self, model_dir: Optional[str | Path] = None, *, logger: Optional[logging.Logger] = None):
        """
        Initialize and load all model artifacts used by the engine.

        Args:
            model_dir: Directory that contains a `models/` folder and the LSTM artifacts.
                      Defaults to the directory containing this file.
            logger: Optional logger for production diagnostics.
        """
        self._logger = logger or logging.getLogger(self.__class__.__name__)
        self._base_dir = Path(model_dir) if model_dir is not None else Path(__file__).resolve().parent

        # Expose these as requested attributes.
        self.predictor = predictor
        self.isolation_detector = IsolationDetector()
        self.autoencoder_detector = AutoencoderDetector()

        try:
            self._lstm = self._load_lstm_artifacts()
            self._load_isolation_forest_artifacts()
            self._load_autoencoder_artifacts()
        except Exception as exc:
            # Keep logs rich for operators, but raise a stable error for API callers.
            self._logger.exception("Failed to initialize AnomalyEngine artifacts")
            raise AnomalyEngineError("Failed to initialize anomaly engine artifacts") from exc

    def _load_lstm_artifacts(self) -> _LSTMArtifacts:
        """
        Load the trained LSTM model and its scaler used by `predictor.py`.
        """
        model_path = self._base_dir / "multivariate_lstm_model.pth"
        scaler_path = self._base_dir / "feature_scaler.pkl"

        if not model_path.exists():
            raise FileNotFoundError(f"Missing LSTM weights: {model_path}")
        if not scaler_path.exists():
            raise FileNotFoundError(f"Missing LSTM scaler: {scaler_path}")

        model = self.predictor.SpendingLSTM(input_size=1, hidden_size=64, num_layers=2)
        state = torch.load(model_path, map_location="cpu")
        model.load_state_dict(state)
        model.eval()

        scaler = joblib.load(scaler_path)
        return _LSTMArtifacts(model=model, scaler=scaler)

    def _load_isolation_forest_artifacts(self) -> None:
        """
        Load Isolation Forest model. Note: the existing `IsolationDetector.train()`
        saves the model but not the scaler; we fit the scaler on-demand per request.
        """
        model_path = self._base_dir / "models" / "isolation_forest.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Missing Isolation Forest model: {model_path}")

        self.isolation_detector.model = joblib.load(model_path)

    def _load_autoencoder_artifacts(self) -> None:
        """
        Load Autoencoder weights and scaler.
        """
        model_path = self._base_dir / "models" / "autoencoder_model.pth"
        scaler_path = self._base_dir / "models" / "autoencoder_scaler.pkl"

        if not model_path.exists():
            raise FileNotFoundError(f"Missing Autoencoder weights: {model_path}")
        if not scaler_path.exists():
            raise FileNotFoundError(f"Missing Autoencoder scaler: {scaler_path}")

        self.autoencoder_detector.scaler = joblib.load(scaler_path)

        model = TransactionAutoencoder(input_dim=1)
        state = torch.load(model_path, map_location="cpu")
        model.load_state_dict(state)
        model.eval()
        self.autoencoder_detector.model = model

    def _predict_expected_spending(self, sequence: List[float]) -> float:
        """
        Predict next expected spending amount (numeric) from a univariate sequence.
        """
        if not sequence:
            raise ValueError("sequence must contain at least 1 recent spending value")

        seq_np = np.array(sequence, dtype=float).reshape(-1, 1)
        seq_scaled = self._lstm.scaler.transform(seq_np)
        tensor = torch.tensor(seq_scaled).float().unsqueeze(0)  # (1, seq_len, 1)

        with torch.no_grad():
            pred_scaled = self._lstm.model(tensor).item()

        pred_actual = self._lstm.scaler.inverse_transform(np.array([[pred_scaled]], dtype=float))[0, 0]
        return float(pred_actual)

    def compute_residual(self, predicted: float, actual: float) -> float:
        """
        Compute absolute residual between predicted and actual spending.
        """
        return float(abs(actual - predicted))

    def analyze_transaction(self, transaction_amount: float, sequence: List[float]) -> Dict[str, float]:
        """
        Analyze a new transaction by combining multiple anomaly signals.

        Args:
            transaction_amount: New transaction amount (actual).
            sequence: List of recent spending values used for LSTM prediction.

        Returns:
            Dictionary with per-model scores and a final combined anomaly score.
        """
        try:
            amount = float(transaction_amount)
            seq = [float(x) for x in sequence]
            if not np.isfinite(amount):
                raise ValueError("transaction_amount must be a finite number")
            if any(not np.isfinite(x) for x in seq):
                raise ValueError("sequence must contain only finite numbers")

            predicted = self._predict_expected_spending(seq)
            residual = self.compute_residual(predicted=predicted, actual=amount)

            # Fit detector scaler if never fitted (its training method does not persist it).
            if not hasattr(self.isolation_detector.scaler, "mean_"):
                fit_values = np.array(seq + [amount], dtype=float).reshape(-1, 1)
                self.isolation_detector.scaler.fit(fit_values)

            if self.autoencoder_detector.model is None:
                raise RuntimeError("Autoencoder model is not loaded")
            if self.isolation_detector.model is None:
                raise RuntimeError("Isolation Forest model is not loaded")

            iso_score = float(self.isolation_detector.detect(amount))
            auto_score = float(self.autoencoder_detector.detect(amount))

            final_score = (0.4 * auto_score) + (0.3 * iso_score) + (0.3 * residual)

            return {
                "predicted_spending": float(predicted),
                "actual_spending": float(amount),
                "residual": float(residual),
                "autoencoder_score": float(auto_score),
                "isolation_score": float(iso_score),
                "final_anomaly_score": float(final_score),
            }
        except Exception as exc:
            # Log full details for observability, raise stable error to API.
            self._logger.exception(
                "Anomaly analysis failed",
                extra={
                    "transaction_amount": transaction_amount,
                    "sequence_len": len(sequence) if sequence is not None else None,
                },
            )
            raise AnomalyEngineError("Failed to analyze transaction") from exc

