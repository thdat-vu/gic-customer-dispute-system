from dataclasses import dataclass

from sqlalchemy import case as sql_case
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import CaseStatus, OutcomeValue
from app.models import Case


@dataclass(frozen=True)
class MonthlyOutcomeCount:
    key: str
    won: int
    lost: int
    fraud_confirmed: int


def monthly_resolved_outcome_counts(session: Session) -> list[MonthlyOutcomeCount]:
    """Return documented monthly counts for resolved cases only."""
    month = func.substr(Case.created_at, 1, 7).label("key")
    statement = (
        select(
            month,
            func.sum(sql_case((Case.outcome == OutcomeValue.WON, 1), else_=0)).label("won"),
            func.sum(sql_case((Case.outcome == OutcomeValue.LOST, 1), else_=0)).label("lost"),
            func.sum(
                sql_case((Case.outcome == OutcomeValue.FRAUD_CONFIRMED, 1), else_=0)
            ).label("fraud_confirmed"),
        )
        .where(Case.status == CaseStatus.RESOLVED)
        .group_by(month)
        .order_by(month)
    )

    return [
        MonthlyOutcomeCount(
            key=row.key,
            won=row.won,
            lost=row.lost,
            fraud_confirmed=row.fraud_confirmed,
        )
        for row in session.execute(statement)
    ]
