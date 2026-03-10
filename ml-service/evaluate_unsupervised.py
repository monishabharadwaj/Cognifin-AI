"""
Lightweight evaluation utilities for IsolationForest and BehaviourCluster.

These helpers are optional and intended for offline inspection; they do not
change runtime behaviour of the main service.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import silhouette_score

from behaviour_cluster import BehaviourCluster
from isolation_detector import IsolationDetector


def evaluate_isolation_forest(df: pd.DataFrame) -> dict:
    detector = IsolationDetector()
    detector.train(df)

    # Use the fitted model to compute anomaly labels on the training set
    features = detector.prepare_features(df)
    scaled = detector.scaler.transform(features.values)
    labels = detector.model.predict(scaled)  # 1 normal, -1 anomaly

    anomaly_rate = float((labels == -1).mean())
    return {
        "n_samples": int(len(df)),
        "anomaly_rate": anomaly_rate,
        "contamination": detector.model.contamination,
    }


def evaluate_behaviour_clusters(df: pd.DataFrame, n_clusters: int = 3) -> dict:
    clusterer = BehaviourCluster(n_clusters=n_clusters)
    features = clusterer.prepare_features(df)
    scaled = clusterer.scaler.fit_transform(features)
    model = clusterer.model.fit(scaled)

    labels = model.labels_

    # Silhouette score is only defined when n_labels > 1 and < n_samples
    if len(set(labels)) > 1 and len(features) > len(set(labels)):
        sil = silhouette_score(scaled, labels)
    else:
        sil = float("nan")

    _, counts = np.unique(labels, return_counts=True)

    return {
        "n_users": int(len(features)),
        "n_clusters": int(n_clusters),
        "cluster_sizes": counts.tolist(),
        "silhouette": float(sil),
    }


if __name__ == "__main__":
    # Simple smoke test with synthetic data
    data = {
        "user_id": [1, 1, 2, 2, 3, 3],
        "amount": [100, 120, 300, 320, 800, 820],
    }
    df = pd.DataFrame(data)

    iso_report = evaluate_isolation_forest(df)
    print("IsolationForest report:", iso_report)

    cluster_report = evaluate_behaviour_clusters(df)
    print("BehaviourCluster report:", cluster_report)

