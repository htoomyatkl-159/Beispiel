"""Request and response contracts for the private recommendation service."""

from pydantic import BaseModel, ConfigDict, Field


class SimilarRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sourceTrackId: str = Field(min_length=1, max_length=200)
    catalogVersion: str = Field(min_length=1, max_length=100)
    limit: int = Field(default=5, ge=1, le=100)


class SimilarTrack(BaseModel):
    sourceTrackId: str
    title: str
    artists: str
    cosineDistance: float
    cosineSimilarity: float
    reasonCode: str


class SimilarResponse(BaseModel):
    seedSourceTrackId: str
    catalogVersion: str
    modelVersion: str
    results: list[SimilarTrack]

