import pandas as pd

from autoencoder_detector import AutoencoderDetector


if __name__ == "__main__":
    df = pd.DataFrame(
        {
            "amount": [100, 120, 130, 150, 170, 200, 250],
        }
    )

    detector = AutoencoderDetector()
    detector.train(df)

    score_normal = detector.detect(180)
    score_anomaly = detector.detect(5000)

    print("Normal error:", score_normal)
    print("Anomaly error:", score_anomaly)

