import asyncio
from pathlib import Path
import unittest

from service.main import ServiceState, create_app, get_similar_response
from service.settings import Settings
from engine.artifacts import load_snapshot


ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_ROOT = ROOT / "artifacts"


class ServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(Settings("tiny", ARTIFACT_ROOT))
        cls.app.state.service = ServiceState(load_snapshot("tiny", ARTIFACT_ROOT), Settings("tiny", ARTIFACT_ROOT))
        cls.health = cls.app.state.service.snapshot.manifest

    def test_health_reports_loaded_snapshot(self):
        self.assertEqual(self.health["profile"], "tiny")
        self.assertEqual(self.health["rowCount"], 40)

    def test_similar_matches_engine_contract(self):
        payload = {"sourceTrackId": "5SuOikwiRyPMVoIQDJUgSV",
                   "catalogVersion": self.health["catalogVersion"], "limit": 3}
        body = get_similar_response(self.app.state.service, __import__('service.schemas', fromlist=['SimilarRequest']).SimilarRequest(**payload))
        self.assertEqual(body.seedSourceTrackId, payload["sourceTrackId"])
        self.assertEqual(len(body.results), 3)
        self.assertNotIn(payload["sourceTrackId"], [row.sourceTrackId for row in body.results])

    def test_repeated_requests_are_stable(self):
        payload = {"sourceTrackId": "5SuOikwiRyPMVoIQDJUgSV",
                   "catalogVersion": self.health["catalogVersion"], "limit": 5}
        request_type = __import__('service.schemas', fromlist=['SimilarRequest']).SimilarRequest
        self.assertEqual(get_similar_response(self.app.state.service, request_type(**payload)),
                         get_similar_response(self.app.state.service, request_type(**payload)))

    def test_unknown_track_and_mismatched_catalog(self):
        base = {"sourceTrackId": "missing", "catalogVersion": self.health["catalogVersion"]}
        request_type = __import__('service.schemas', fromlist=['SimilarRequest']).SimilarRequest
        with self.assertRaises(KeyError): get_similar_response(self.app.state.service, request_type(**base))
        base["sourceTrackId"] = "5SuOikwiRyPMVoIQDJUgSV"
        base["catalogVersion"] = "wrong"
        with self.assertRaises(ValueError): get_similar_response(self.app.state.service, request_type(**base))

    def test_bad_limits_and_extra_fields_are_rejected(self):
        base = {"sourceTrackId": "5SuOikwiRyPMVoIQDJUgSV", "catalogVersion": self.health["catalogVersion"]}
        request_type = __import__('service.schemas', fromlist=['SimilarRequest']).SimilarRequest
        from pydantic import ValidationError
        with self.assertRaises(ValidationError): request_type(**{**base, "limit": 0})
        with self.assertRaises(ValidationError): request_type(**{**base, "limit": 101})
        with self.assertRaises(ValidationError): request_type(**{**base, "unexpected": True})


if __name__ == "__main__":
    unittest.main()
