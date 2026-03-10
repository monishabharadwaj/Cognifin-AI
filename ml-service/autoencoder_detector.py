import numpy as np
import json
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

from config import AUTOENCODER_CONFIG


class TransactionAutoencoder(nn.Module):

    def __init__(self, input_dim):

        super(TransactionAutoencoder, self).__init__()

        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU()
        )

        self.decoder = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, input_dim)
        )

    def forward(self, x):

        encoded = self.encoder(x)

        decoded = self.decoder(encoded)

        return decoded


class AutoencoderDetector:

    def __init__(self):

        self.model = None
        self.scaler = StandardScaler()

    def train(self, df):

        # Backward-compatible column normalization.
        if "amount" not in df.columns and "Amount" in df.columns:
            df = df.rename(columns={"Amount": "amount"})
        if "amount" not in df.columns:
            raise KeyError("Expected transaction column 'amount'")

        features = df[["amount"]].values

        scaled = self.scaler.fit_transform(features)

        X = torch.tensor(scaled).float()

        self.model = TransactionAutoencoder(input_dim=X.shape[1])

        optimizer = optim.Adam(
            self.model.parameters(),
            lr=AUTOENCODER_CONFIG.learning_rate,
            weight_decay=AUTOENCODER_CONFIG.weight_decay,
        )

        loss_fn = nn.MSELoss()

        # Simple train/validation split for monitoring reconstruction error
        split = int(len(X) * 0.8)
        X_train = X[:split]
        X_val = X[split:] if split < len(X) else X[:0]

        train_losses = []
        val_losses = []

        for epoch in range(AUTOENCODER_CONFIG.epochs):

            self.model.train()
            reconstructed = self.model(X_train)
            loss = loss_fn(reconstructed, X_train)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            train_losses.append(float(loss.item()))

            self.model.eval()
            with torch.no_grad():
                if len(X_val) > 0:
                    val_recon = self.model(X_val)
                    val_loss = loss_fn(val_recon, X_val).item()
                else:
                    val_loss = float("nan")
            val_losses.append(val_loss)

            print(f"Epoch: {epoch} Train Loss: {loss.item()} Val Loss: {val_loss}")

        models_dir = Path(__file__).resolve().parent / "models"
        models_dir.mkdir(parents=True, exist_ok=True)

        # Save model and scaler using centralized config paths
        torch.save(self.model.state_dict(), str(AUTOENCODER_CONFIG.model_path))
        joblib.dump(self.scaler, str(AUTOENCODER_CONFIG.scaler_path))

        # Compute basic reconstruction-error distribution statistics for calibration
        self.model.eval()
        with torch.no_grad():
            full_recon = self.model(X)
        full_errors = ((X - full_recon) ** 2).mean(dim=1).cpu().numpy()

        stats = {
            "count": int(len(full_errors)),
            "mean_error": float(full_errors.mean()),
            "std_error": float(full_errors.std()),
            "p95_error": float(np.percentile(full_errors, 95)) if len(full_errors) > 0 else None,
            "p99_error": float(np.percentile(full_errors, 99)) if len(full_errors) > 0 else None,
            "train_losses": train_losses,
            "val_losses": val_losses,
        }

        with AUTOENCODER_CONFIG.stats_path.open("w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2)

    def detect(self, transaction_amount):

        self.model.eval()

        scaled = self.scaler.transform([[transaction_amount]])

        tensor = torch.tensor(scaled).float()

        with torch.no_grad():

            reconstructed = self.model(tensor)

        error = torch.mean((tensor - reconstructed) ** 2)

        return error.item()

