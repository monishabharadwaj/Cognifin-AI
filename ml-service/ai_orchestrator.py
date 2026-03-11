from insights_engine import InsightsEngine
from ai_financial_engine import FinancialAIEngine
from anomaly_engine import AnomalyEngine
from predictor import predict_next
from budget_engine import BudgetEngine


class FinancialAIOrchestrator:

    def __init__(self):

        self.insights_engine = InsightsEngine()
        self.financial_engine = FinancialAIEngine()
        self.anomaly_engine = AnomalyEngine()
        self.budget_engine = BudgetEngine()


    # ---------------------------------
    # Full Financial Intelligence Report
    # ---------------------------------
    def generate_complete_financial_analysis(self, transactions):

        insights = self.insights_engine.generate_insights(transactions)

        financial_advice = self.financial_engine.generate_full_financial_report(
            transactions
        )

        return {
            "insights": insights,
            "advice": financial_advice
        }


    # ---------------------------------
    # Spending Prediction
    # ---------------------------------
    def predict_future_spending(self, sequence):

        prediction = predict_next(sequence)

        return {
           "predicted_next_spending": float(str(prediction).replace("₹", ""))
        }


    # ---------------------------------
    # Unusual Spending Analysis
    # ---------------------------------
    def analyze_transaction(self, amount, sequence):

        result = self.anomaly_engine.analyze_transaction(
            transaction_amount=amount,
            sequence=sequence
        )

        return result


    # ---------------------------------
    # Chatbot Intelligence
    # ---------------------------------
    def financial_chat(self, question, transactions):

        response = self.financial_engine.answer_question(
            question,
            transactions
        )

        return {
            "response": response
        }

    # ---------------------------------
    # Budget Analysis
    # ---------------------------------
    def analyze_budget(self, transactions, budgets):

        return self.budget_engine.analyze_budget_usage(
            transactions,
            budgets
        )