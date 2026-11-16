FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app
COPY pyproject.toml ./
COPY rideforce ./rideforce
RUN pip install .

FROM base AS test
COPY tests ./tests
RUN pip install ".[dev]"
CMD ["pytest", "-q"]

FROM base AS runtime
RUN useradd --uid 10001 --no-create-home rideforce
USER 10001
EXPOSE 8000
CMD ["uvicorn", "rideforce.api:app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
