import json
from pathlib import Path

import torch
import torch.optim as optim
import torch.nn as nn
import joblib
import pandas as pd

from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import MinMaxScaler
from torch.utils.data import DataLoader, TensorDataset
from kaggle_loader import load_kaggle_dataset
from kaggle_preprocess import preprocess_kaggle_data
from sequence_builder import create_sequences
from lstm_model import SpendingLSTM
from config import LSTM_CONFIG, MODELS_DIR

# Load dataset
df = load_kaggle_dataset()
df = preprocess_kaggle_data(df)

# Sort by date (VERY IMPORTANT for time-series)
df['Date'] = pd.to_datetime(df['Date'])
df = df.sort_values('Date')

# debug checks before training
print("Dataset shape:", df.shape)
print(df.head())
print("Columns:", df.columns)

def train():

    global df

    if df is None or len(df) < 20:
        print("Not enough data to train the model")
        return

    # Normalize Amount (univariate time-series)
    scaler = MinMaxScaler()

    features = df[['Amount']].values

    # Scale to [0, 1] range
    scaled_features = scaler.fit_transform(features)

    # Create univariate sequences (uses configured sequence length)
    X, y = create_sequences(scaled_features.flatten(), seq_length=LSTM_CONFIG.seq_length)

    X = torch.tensor(X).float().unsqueeze(-1)
    y = torch.tensor(y).float()

    # Train/test split
    split = int(len(X) * 0.8)

    X_train = X[:split]
    X_test = X[split:]

    y_train = y[:split]
    y_test = y[split:]

    # Create DataLoader for mini-batch training
    dataset = TensorDataset(X_train, y_train)
    loader = DataLoader(dataset, batch_size=LSTM_CONFIG.batch_size, shuffle=True)

    model = SpendingLSTM(input_size=1, hidden_size=LSTM_CONFIG.hidden_size, num_layers=LSTM_CONFIG.num_layers)
    model.train()

    optimizer = optim.Adam(model.parameters(), lr=LSTM_CONFIG.learning_rate)
    loss_fn = nn.MSELoss()

    for epoch in range(LSTM_CONFIG.epochs):

        for batch_X, batch_y in loader:

            pred = model(batch_X)

            loss = loss_fn(pred.squeeze(), batch_y)

            optimizer.zero_grad()
            loss.backward()
            # basic gradient clipping for stability
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

        print("Epoch:", epoch, "Loss:", loss.item())

    # Evaluate model
    model.eval()

    with torch.no_grad():
        test_pred = model(X_test)

    # Evaluate in scaled space
    y_true = y_test.numpy()
    y_pred = test_pred.detach().squeeze().numpy()
    test_loss = loss_fn(test_pred.squeeze(), y_test).item()
    mae = mean_absolute_error(y_true, y_pred)
    # Older scikit-learn versions don't support squared=False; compute RMSE manually.
    mse = mean_squared_error(y_true, y_pred)
    rmse = mse ** 0.5

    print("Test Loss (MSE):", test_loss)
    print("Test MAE:", mae)
    print("Test RMSE:", rmse)

    # Persist a simple training report
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = MODELS_DIR / "lstm_training_report.json"
    with report_path.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "samples": len(X),
                "train_samples": len(X_train),
                "test_samples": len(X_test),
                "seq_length": LSTM_CONFIG.seq_length,
                "batch_size": LSTM_CONFIG.batch_size,
                "epochs": LSTM_CONFIG.epochs,
                "learning_rate": LSTM_CONFIG.learning_rate,
                "hidden_size": LSTM_CONFIG.hidden_size,
                "num_layers": LSTM_CONFIG.num_layers,
                "test_mse": test_loss,
                "test_mae": mae,
                "test_rmse": rmse,
            },
            f,
            indent=2,
        )

    # Save artifacts (keep existing filenames for compatibility)
    torch.save(model.state_dict(), str(LSTM_CONFIG.model_path))
    joblib.dump(scaler, str(LSTM_CONFIG.scaler_path))

    print("Model, scaler, and training report saved successfully!")

    return model


if __name__ == "__main__":
    train()