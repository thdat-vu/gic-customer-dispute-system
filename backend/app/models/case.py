from datetime import UTC, datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now_iso8601() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


class Case(Base):
    __tablename__ = "case"
    __table_args__ = (
        CheckConstraint("status IN ('open', 'resolved')", name="ck_case_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    user_email: Mapped[str] = mapped_column(String, nullable=False, index=True)
    device_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, nullable=False, index=True)
    region: Mapped[str] = mapped_column(String, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    # Historical seed data includes an invalid-for-new-writes value ("maybe").
    outcome: Mapped[str | None] = mapped_column(String, nullable=True)
    outcome_note: Mapped[str | None] = mapped_column(String, nullable=True)


class OutcomeAuditEntry(Base):
    __tablename__ = "outcome_audit_entry"
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('captured', 'corrected')",
            name="ck_outcome_audit_entry_event_type",
        ),
        Index(
            "ix_outcome_audit_entry_case_ref_id_changed_at",
            "case_ref_id",
            "changed_at",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_ref_id: Mapped[int] = mapped_column(
        ForeignKey("case.id"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    previous_outcome: Mapped[str | None] = mapped_column(String, nullable=True)
    new_outcome: Mapped[str] = mapped_column(String, nullable=False)
    previous_note: Mapped[str | None] = mapped_column(String, nullable=True)
    new_note: Mapped[str | None] = mapped_column(String, nullable=True)
    editor_role: Mapped[str] = mapped_column(String, nullable=False)
    changed_at: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default=utc_now_iso8601,
        server_default=text("CURRENT_TIMESTAMP"),
        index=True,
    )
