import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib


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

        features = df[["amount"]].values

        scaled = self.scaler.fit_transform(features)

        X = torch.tensor(scaled).float()

        self.model = TransactionAutoencoder(input_dim=X.shape[1])

        optimizer = optim.Adam(self.model.parameters(), lr=0.001)

        loss_fn = nn.MSELoss()

        for epoch in range(30):

            reconstructed = self.model(X)

            loss = loss_fn(reconstructed, X)

            optimizer.zero_grad()

            loss.backward()

            optimizer.step()

            print("Epoch:", epoch, "Loss:", loss.item())

        torch.save(self.model.state_dict(), "models/autoencoder_model.pth")

        joblib.dump(self.scaler, "models/autoencoder_scaler.pkl")

    def detect(self, transaction_amount):

        self.model.eval()

        scaled = self.scaler.transform([[transaction_amount]])

        tensor = torch.tensor(scaled).float()

        with torch.no_grad():

            reconstructed = self.model(tensor)

        error = torch.mean((tensor - reconstructed) ** 2)

        return error.item()

