"""FastAPI wrapper around the already-fitted M01 engine.

The model is loaded once during application startup. Requests only query the
loaded model; they never fit a scaler, read SQLite, or contact the original
student project.
"""

from contextlib import asynccontextmanager
from dataclasses import dataclass

from fastapi import FastAPI, HTTPException, Request

from engine.artifacts import Snapshot, load_snapshot

from .schemas import SimilarRequest, SimilarResponse
from .settings import Settings


@dataclass
class ServiceState:
    snapshot: Snapshot
    settings: Settings


def get_similar_response(state: ServiceState, payload: SimilarRequest) -> SimilarResponse:
    expected = state.snapshot.manifest["catalogVersion"]
    if payload.catalogVersion != expected:
        raise ValueError("Catalog version does not match the loaded snapshot.")
    try:
        results = state.snapshot.engine.recommend(payload.sourceTrackId, payload.limit)
    except KeyError:
        raise KeyError("The source track ID is not in the loaded catalog.")
    return SimilarResponse(seedSourceTrackId=payload.sourceTrackId, catalogVersion=expected,
                           modelVersion=state.snapshot.manifest["modelVersion"], results=results)


def create_app(settings: Settings | None = None) -> FastAPI:
    selected = settings or Settings.from_env()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        snapshot = load_snapshot(selected.artifact_profile, selected.artifact_root)
        app.state.service = ServiceState(snapshot, selected)
        yield
        app.state.service = None

    app = FastAPI(title="Beispiel Recommendation Service", version="0.1.0", lifespan=lifespan)

    @app.get("/health")
    async def health(request: Request):
        state: ServiceState | None = getattr(request.app.state, "service", None)
        if state is None:
            raise HTTPException(status_code=503, detail="Recommendation snapshot is not loaded.")
        return {"data": {"status": "ok", "profile": state.settings.artifact_profile,
                          "rowCount": state.snapshot.manifest["rowCount"],
                          "catalogVersion": state.snapshot.manifest["catalogVersion"],
                          "modelVersion": state.snapshot.manifest["modelVersion"]}}

    @app.post("/v1/similar", response_model=SimilarResponse)
    async def similar(payload: SimilarRequest, request: Request):
        state: ServiceState | None = getattr(request.app.state, "service", None)
        if state is None:
            raise HTTPException(status_code=503, detail="Recommendation snapshot is not loaded.")
        try:
            return get_similar_response(state, payload)
        except ValueError:
            raise HTTPException(status_code=409, detail="Catalog version does not match the loaded snapshot.")
        except KeyError:
            raise HTTPException(status_code=404, detail="The source track ID is not in the loaded catalog.")

    return app


app = create_app()

