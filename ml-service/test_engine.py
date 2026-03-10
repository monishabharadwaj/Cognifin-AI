from anomaly_engine import AnomalyEngine


if __name__ == "__main__":
    engine = AnomalyEngine()

    sequence = [
        100, 110, 120, 130, 140,
        150, 160, 170, 180, 190,
    ]

    result = engine.analyze_transaction(
        transaction_amount=5000,
        sequence=sequence,
    )

    print(result)

