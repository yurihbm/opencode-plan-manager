# Implementation Plan

Implementation follows the four phases defined in TELEMETRY_AND_O11Y.md. Each phase uses TDD Red-Green-Refactor. Tests are written FIRST (Red), then minimal implementation (Green), then cleanup (Refactor). Mocks and NoOp providers enable testing without OTel infrastructure. Commit after completing each phase.

## Phase 1: Domain Interfaces & Provider Abstraction

- [ ] Update TELEMETRY_AND_O11Y.md: replace `internal/api/context.go` references with `internal/shared/context.go`
- [ ] Define interfaces in `internal/domain/telemetry.go` (TelemetryProvider, Tracer, Meter, Span)
- [ ] RED: Write unit tests for NoOp provider (`internal/providers/noop_telemetry_provider_test.go`)
- [ ] GREEN: Implement NoOp provider in `internal/providers/noop_telemetry_provider.go`
- [ ] REFACTOR: Review NoOp provider for zero-overhead and clean interface compliance
- [ ] Implement TelemetryProvider mock in `internal/mocks/telemetry_provider_mock.go` with testify/mock
- [ ] Install OTel SDK deps: otel, otel/sdk, otlptrace/otlptracehttp, otlpmetric/otlpmetrichttp, otelhttp, otelpgx
- [ ] RED: Write unit tests for OTel provider init, shutdown, Tracer(), Meter() methods
- [ ] GREEN: Implement OTel provider in `internal/providers/otel_telemetry_provider.go`
- [ ] REFACTOR: Extract OTLP exporter config, ensure graceful shutdown and error handling
- [ ] Commit all Phase 1 changes with a descriptive message

## Phase 2: Go Application Instrumentation

- [ ] RED: Write tests asserting TraceID/SpanID fields exist on `shared.RequestContextData`
- [ ] GREEN: Add `TraceID` and `SpanID` string fields to `shared.RequestContextData` in `internal/shared/context.go`
- [ ] RED: Write TelemetryMiddleware tests (`internal/middlewares/telemetry_middleware_test.go`)
- [ ] GREEN: Implement TelemetryMiddleware in `internal/middlewares/telemetry_middleware.go`
- [ ] REFACTOR: Ensure TelemetryMiddleware follows GlobalMiddleware interface and SRP
- [ ] RED: Update LoggerMiddleware tests to assert traceID/spanID are logged when present
- [ ] GREEN: Update LoggerMiddleware to read and log TraceID/SpanID from RequestContextData
- [ ] REFACTOR: Ensure LoggerMiddleware has zero OTel imports — reads only string fields
- [ ] Create `internal/factories/telemetry_factory.go` to init provider based on OTEL_ENABLED env var
- [ ] Update `cmd/main.go`: init telemetry, inject into middleware, set correct chain order, add shutdown
- [ ] Instrument DB layer: configure pgx with `otelpgx` tracer in `postgres/connection.go`
- [ ] Add OTEL env vars to `.env.example`: OTEL_ENABLED, OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME
- [ ] Run full test suite to verify existing tests pass with telemetry disabled (NoOp provider)
- [ ] Commit all Phase 2 changes with a descriptive message

## Phase 3: Docker Compose Infrastructure (Grafana LGTM)

- [ ] Create `docker/otel/otel-collector-config.yaml` with OTLP receivers, batch processors, exporters
- [ ] Create `docker/tempo/tempo-config.yaml` for distributed tracing backend
- [ ] Create `docker/loki/loki-config.yaml` for log aggregation backend
- [ ] Create `docker/prometheus/prometheus.yaml` for metrics scraping config
- [ ] Create `docker/grafana/provisioning/datasources/datasources.yaml` with Tempo, Prometheus, Loki sources
- [ ] Create `docker/grafana/provisioning/dashboards/dashboards.yaml` for dashboard auto-provisioning
- [ ] Create `docker/grafana/dashboards/api-overview.json` with request rate, error rate, latency panels
- [ ] Update `docker/docker-compose.dev.yaml` with OTel Collector, Tempo, Loki, Prometheus, Grafana services
- [ ] Update `docker/docker-compose.prod.yaml` with observability services, persistent volumes, resource limits
- [ ] Commit all Phase 3 changes with a descriptive message

## Phase 4: Documentation, Testing & Verification

- [ ] Update README.md with observability section: setup, Grafana access, env vars, provider swapping
- [ ] Run full unit test suite (`go test ./...`) and verify 0 failures
- [ ] Manual test: start dev env, make API requests, verify traces in Grafana Tempo
- [ ] Manual test: verify logs in Loki show `trace_id` and link to traces
- [ ] Manual test: verify Prometheus scrapes metrics and Grafana dashboard renders correctly
- [ ] Manual test: verify app works with OTEL_ENABLED=false (graceful degradation)
- [ ] Manual test: verify app works when OTel Collector is unavailable (logs warning, continues)
- [ ] Commit all Phase 4 changes with a descriptive message