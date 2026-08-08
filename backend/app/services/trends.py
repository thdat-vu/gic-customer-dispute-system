from dataclasses import dataclass

from sqlalchemy import case as sql_case
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import CaseStatus, OutcomeValue, TrendGroupBy
from app.models import Case


@dataclass(frozen=True)
class MonthlyOutcomeCount:
    key: str
    won: int
    lost: int
    fraud_confirmed: int


def resolved_outcome_counts(
    session: Session, group_by: str = TrendGroupBy.MONTH
) -> list[MonthlyOutcomeCount]:
    """Return documented resolved-case counts grouped by month or region."""
    group_key = (
        func.substr(Case.created_at, 1, 7).label("key")
        if group_by == TrendGroupBy.MONTH
        else Case.region.label("key")
    )
    statement = (
        select(
            group_key,
            func.sum(sql_case((Case.outcome == OutcomeValue.WON, 1), else_=0)).label("won"),
            func.sum(sql_case((Case.outcome == OutcomeValue.LOST, 1), else_=0)).label("lost"),
            func.sum(
                sql_case((Case.outcome == OutcomeValue.FRAUD_CONFIRMED, 1), else_=0)
            ).label("fraud_confirmed"),
        )
        .where(Case.status == CaseStatus.RESOLVED)
        .group_by(group_key)
        .order_by(group_key)
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


def monthly_resolved_outcome_counts(session: Session) -> list[MonthlyOutcomeCount]:
    return resolved_outcome_counts(session, TrendGroupBy.MONTH)
