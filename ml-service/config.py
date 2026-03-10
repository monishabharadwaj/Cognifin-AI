from __future__ import annotations

"""
Central configuration for ml-service training and inference.

These values are deliberately simple and have safe defaults so existing
behaviour is preserved. Override via environment variables or higher-level
config management in the API layer if needed.
"""

from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"


@dataclass(frozen=True)
class LSTMConfig:
    seq_length: int = 10
    batch_size: int = 32
    hidden_size: int = 64
    num_layers: int = 2
    epochs: int = 50
    learning_rate: float = 0.001

    model_path: Path = BASE_DIR / "multivariate_lstm_model.pth"
    scaler_path: Path = BASE_DIR / "feature_scaler.pkl"


@dataclass(frozen=True)
class AutoencoderConfig:
    epochs: int = 30
    learning_rate: float = 0.001
    weight_decay: float = 0.0  # can be tuned later

    model_path: Path = MODELS_DIR / "autoencoder_model.pth"
    scaler_path: Path = MODELS_DIR / "autoencoder_scaler.pkl"
    stats_path: Path = MODELS_DIR / "autoencoder_stats.json"


@dataclass(frozen=True)
class IsolationForestConfig:
    n_estimators: int = 100
    contamination: float = 0.05
    random_state: int = 42

    model_path: Path = MODELS_DIR / "isolation_forest.pkl"
    scaler_path: Path = MODELS_DIR / "isolation_scaler.pkl"


@dataclass(frozen=True)
class EnsembleConfig:
    # Weights used in final anomaly score:
    # final = w_auto * auto_score + w_iso * iso_score + w_residual * residual_score
    w_auto: float = 0.4
    w_iso: float = 0.3
    w_residual: float = 0.3

    # Example calibrated bands for interpretation (can be tuned offline).
    low_threshold: float = 0.2
    medium_threshold: float = 0.5
    high_threshold: float = 0.8


LSTM_CONFIG = LSTMConfig()
AUTOENCODER_CONFIG = AutoencoderConfig()
ISOLATION_CONFIG = IsolationForestConfig()
ENSEMBLE_CONFIG = EnsembleConfig()

