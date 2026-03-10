import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


class BehaviourCluster:
    """
    Clustering model for user financial behaviour segmentation.
    
    Uses KMeans to group users into clusters based on:
    - Average transaction amount
    - Transaction frequency
    - Total spending
    """

    def __init__(self, n_clusters=3):
        self.n_clusters = n_clusters
        self.model = KMeans(n_clusters=n_clusters, random_state=42)
        self.scaler = StandardScaler()

    def prepare_features(self, df):
        """
        Extract behavioral features from transaction dataframe.
        
        Args:
            df: DataFrame with columns [user_id, amount]
        
        Returns:
            Features DataFrame with avg_amount, transaction_count, total_spending
        """
        features = pd.DataFrame()

        features["avg_amount"] = df.groupby("user_id")["amount"].mean()
        features["transaction_count"] = df.groupby("user_id")["amount"].count()
        features["total_spending"] = df.groupby("user_id")["amount"].sum()

        return features

    def train(self, df):
        """
        Train the KMeans clustering model.
        
        Args:
            df: DataFrame with user transactions
        
        Returns:
            Trained KMeans model
        """
        features = self.prepare_features(df)

        scaled = self.scaler.fit_transform(features)

        self.model.fit(scaled)

        return self.model

    def predict_user_cluster(self, user_features):
        """
        Predict which cluster a user belongs to.
        
        Args:
            user_features: List [avg_amount, transaction_count, total_spending]
        
        Returns:
            Cluster ID (0, 1, or 2)
        """
        scaled = self.scaler.transform([user_features])

        cluster = self.model.predict(scaled)

        return cluster[0]
