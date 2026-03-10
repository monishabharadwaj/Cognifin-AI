from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from pathlib import Path
import pandas as pd
import joblib


class IsolationDetector:

    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        )
        self.scaler = StandardScaler()

    def prepare_features(self, df):

        # Backward-compatible column normalization.
        if "amount" not in df.columns and "Amount" in df.columns:
            df = df.rename(columns={"Amount": "amount"})
        if "amount" not in df.columns:
            raise KeyError("Expected transaction column 'amount'")

        features = pd.DataFrame()

        features["amount"] = df["amount"]

        return features

    def train(self, df, model_dir: str | Path | None = None):

        features = self.prepare_features(df)

        # Use raw NumPy values so fit/transform are consistent and avoid feature-name warnings.
        scaled = self.scaler.fit_transform(features.values)

        self.model.fit(scaled)

        base_dir = Path(model_dir) if model_dir is not None else Path(__file__).resolve().parent / "models"
        base_dir.mkdir(parents=True, exist_ok=True)

        joblib.dump(self.model, str(base_dir / "isolation_forest.pkl"))
        joblib.dump(self.scaler, str(base_dir / "isolation_scaler.pkl"))

    def load(self, model_dir: str | Path | None = None):
        """
        Load Isolation Forest model and scaler artifacts from disk.
        """
        base_dir = Path(model_dir) if model_dir is not None else Path(__file__).resolve().parent / "models"
        self.model = joblib.load(str(base_dir / "isolation_forest.pkl"))
        self.scaler = joblib.load(str(base_dir / "isolation_scaler.pkl"))
        return self

    def detect(self, transaction):

        scaled = self.scaler.transform([[transaction]])

        prediction = self.model.predict(scaled)

        return prediction[0]
