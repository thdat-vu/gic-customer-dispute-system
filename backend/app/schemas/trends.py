from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.constants import TrendGroupBy


TrendGroupByValue = Literal[TrendGroupBy.MONTH, TrendGroupBy.REGION]


class TrendBucketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    won: int
    lost: int
    fraud_confirmed: int


class TrendResponse(BaseModel):
    group_by: TrendGroupByValue
    buckets: list[TrendBucketResponse]
