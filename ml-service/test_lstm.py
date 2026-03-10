from predictor import predict_next


if __name__ == "__main__":
    sequence = [
        100, 110.5, 121, 131.5, 142,
        152, 163, 174, 185, 196,
    ]

    pred = predict_next(sequence)

    print("Predicted next spending:", pred)

