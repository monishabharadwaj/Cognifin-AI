from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
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

        features = pd.DataFrame()

        features["amount"] = df["amount"]

        return features

    def train(self, df):

        features = self.prepare_features(df)

        scaled = self.scaler.fit_transform(features)

        self.model.fit(scaled)

        joblib.dump(self.model, "models/isolation_forest.pkl")

    def detect(self, transaction):

        scaled = self.scaler.transform([[transaction]])

        prediction = self.model.predict(scaled)

        return prediction[0]
