from __future__ import annotations

"""
Shared feature engineering utilities for the ml-service.

These helpers are intentionally minimal and backwards-compatible. They can be
extended over time (e.g., rolling statistics, time features) and reused across
models.
"""

from typing import Iterable

import numpy as np
import pandas as pd


def ensure_amount_column(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure the dataframe has a canonical `amount` column.

    Accepts either `amount` or legacy `Amount` and normalizes to `amount`.
    Raises a clear error if neither is present.
    """
    if "amount" in df.columns:
        return df
    if "Amount" in df.columns:
        return df.rename(columns={"Amount": "amount"})
    raise KeyError("Expected transaction column 'amount' or 'Amount'.")


def to_1d_array(values: Iterable[float]) -> np.ndarray:
    """
    Convert an iterable of numeric values to a 1D NumPy array of dtype float.
    """
    return np.asarray(list(values), dtype=float)

