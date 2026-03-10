import pandas as pd

from isolation_detector import IsolationDetector


if __name__ == "__main__":
    df = pd.DataFrame(
        {
            "amount": [100, 120, 130, 150, 170, 200, 250],
        }
    )

    detector = IsolationDetector()
    detector.train(df)

    print("Normal test:", detector.detect(180))
    print("Anomaly test:", detector.detect(5000))

