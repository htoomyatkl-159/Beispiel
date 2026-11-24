# Contributing to Beispiel

Keep the project metadata-first: do not add unauthorized audio, private credentials, or fabricated catalog/trend data. Preserve the Python recommendation engine and stable `track_id` mappings.

Before opening a change, run the relevant frontend and API typechecks, tests, and production builds. For recommendation changes, run the Python test suite too. Never commit `.env` files or local SQLite databases. Document new environment variables and keep public and private service boundaries explicit.
