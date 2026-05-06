# Specifications

Implement comprehensive observability for the Go API using OpenTelemetry for instrumentation and Grafana LGTM stack for collection/visualization. Domain-driven telemetry interfaces (DIP), dedicated TelemetryMiddleware (SRP), NoOp provider for graceful degradation, and full Docker Compose infrastructure. All code changes follow TDD with Red-Green-Refactor cycle. The shared context struct at `internal/shared/context.go` will be extended with TraceID/SpanID fields. The TELEMETRY_AND_O11Y.md document will also be updated to reflect the correct codebase paths.

## Functional Requirements

- Define telemetry interfaces in `internal/domain/telemetry.go`: TelemetryProvider (Init, Shutdown, Tracer, Meter), Tracer (StartSpan, SpanFromContext), Meter (Counter, Histogram, Gauge), Span (SetAttributes, RecordError, End, TraceID, SpanID)
- Implement OpenTelemetry provider in `internal/providers/otel_telemetry_provider.go` using OTLP HTTP exporters for traces and metrics, configurable resource attributes (service name, version, environment), and graceful shutdown
- Implement NoOp provider in `internal/providers/noop_telemetry_provider.go` with zero-overhead no-op operations, used when `OTEL_ENABLED=false`
- Create dedicated `TelemetryMiddleware` in `internal/middlewares/telemetry_middleware.go` that accepts TelemetryProvider via DI, creates HTTP spans, propagates trace context, and populates TraceID/SpanID into `shared.RequestContextData`
- Add `TraceID` and `SpanID` string fields to `shared.RequestContextData` in `internal/shared/context.go`
- Update `LoggerMiddleware` to read and log `TraceID` and `SpanID` from `shared.RequestContextData` (no OTel imports needed)
- Instrument database layer by configuring pgx with OpenTelemetry tracing via `otelpgx` in `postgres/connection.go`
- Wire up telemetry provider in `cmd/main.go`: initialize based on `OTEL_ENABLED`, inject into TelemetryMiddleware, register in correct middleware order (RequestContextData → Telemetry → RequestUUID → Logger), add graceful shutdown
- Add OTEL environment variables to `.env.example`: OTEL_ENABLED, OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME, OTEL_TRACES_SAMPLER
- Create OTel Collector configuration at `docker/otel/otel-collector-config.yaml` with OTLP receivers, batch processors, and Tempo/Prometheus/Loki exporters
- Create Grafana provisioning configs for Tempo, Prometheus, and Loki datasources with trace-to-logs and trace-to-metrics correlation
- Create sample Grafana dashboard at `docker/grafana/dashboards/api-overview.json` with request rate, error rate, latency percentiles, and DB query performance panels
- Create Tempo, Loki, and Prometheus configuration files under `docker/`
- Update `docker/docker-compose.dev.yaml` with OTel Collector, Tempo, Loki, Prometheus, and Grafana services
- Update `docker/docker-compose.prod.yaml` with observability services, persistent volumes, and resource limits
- Create TelemetryProvider mock in `internal/mocks/telemetry_provider_mock.go` following existing mock patterns (testify/mock, interface compliance check)
- Create telemetry factory at `internal/factories/telemetry_factory.go` following existing factory patterns
- Update TELEMETRY_AND_O11Y.md to reflect correct codebase paths (`internal/shared/context.go` instead of `internal/api/context.go`)

## Non-Functional Requirements

- Zero overhead when telemetry is disabled (NoOp provider)
- Existing tests must pass without modification (NoOp provider used in test environments)
- Application must work correctly when OTel Collector is unavailable (log warning, continue without telemetry)
- Async batch exporters to minimize latency impact
- 100% trace sampling in development, configurable probabilistic sampling for production
- All new code must follow TDD with Red-Green-Refactor cycle
- SOLID principles: SRP for middlewares, DIP for telemetry interfaces, OCP for existing middleware preservation

## Acceptance Criteria

- Telemetry interfaces defined in `internal/domain/telemetry.go` with TelemetryProvider, Tracer, Meter, and Span
- OpenTelemetry provider implements all telemetry interfaces with OTLP HTTP exporters
- NoOp provider available and used when OTEL_ENABLED=false or in tests
- Making a request to `GET /health` creates a visible trace in Grafana Tempo
- Database queries appear as child spans in traces
- Logs in Grafana Loki show `trace_id` field and link to traces
- Grafana dashboard shows request rate, error rate, and latency metrics
- Existing tests pass without modification
- Application works correctly when telemetry is disabled or OTel Collector is unavailable
- TelemetryMiddleware has comprehensive unit tests using NoOp provider
- All new code has corresponding tests following TDD Red-Green-Refactor

## Out of Scope

- Custom business metrics (e.g., user registration counters) - can be added later using the Meter interface
- Alerting rules in Grafana - dashboards only for now
- Log shipping from slog to Loki via OTel Collector (logs go to stdout, Loki scrapes from container runtime)
- Modifying existing controller/service/repository layers to add manual span instrumentation - only middleware-level and DB-level instrumentation
- CI/CD pipeline integration for telemetry - only local Docker Compose setup

