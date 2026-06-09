# Vesting Vault Backend & Contracts

[![Tests](https://github.com/Vesting-Vault/backend/actions/workflows/test.yml/badge.svg)](https://github.com/Vesting-Vault/backend/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Vesting Vault is a token vesting protocol built on the Stellar/Soroban network. This repository contains the Node.js backend API and the Soroban Rust smart contracts for on-chain vesting enforcement.

## Project Structure

```
Vesting-Vault/
├── backend/              # Node.js Express API (NestJS + GraphQL)
│   ├── src/              # Application source code
│   ├── test/             # Jest unit & integration tests
│   ├── e2e/              # Playwright end-to-end tests
│   ├── docs/             # Backend-specific documentation
│   ├── migrations/       # Database migrations
│   └── package.json
├── contracts/            # Soroban (Rust) smart contracts
│   ├── merkle_vault/     # Merkle vault contract
│   └── README.md
└── .github/              # CI/CD workflows & Dependabot
```

## Getting Started

### Prerequisites

- **Node.js** >= 20.11.0
- **Rust** + Cargo (for smart contracts)
- **Docker** & Docker Compose (recommended)
- **PostgreSQL** database
- **Redis** cache

### Quick Start (Docker - Recommended)

```bash
git clone https://github.com/Vesting-Vault/backend.git
cd backend

docker-compose up -d

# Verify
curl http://localhost:3000/health
```

Services:
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Backend Setup (Manual)

```bash
cd backend
cp .env.example .env
npm install
npm start
```

### Smart Contracts

```bash
cd contracts
cargo test
```

## Testing

```bash
cd backend

# Run all unit & integration tests
npm test

# Run with coverage
npm run test:coverage

# Integration tests only
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e

# Vesting parity tests
npm run test:parity
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `GET /` | Welcome message |
| `GET /health` | Health check |

### Key Features

- **Vesting Schedules**: Create, manage, and claim token vesting schedules with cliff support
- **Cross-Asset Operations**: Multi-currency vesting with precise decimal normalization (BigNumber.js)
- **Stellar Integration**: SEP-10 authentication, Horizon API with circuit breaker fallback
- **Circuit Breakers**: Protection against database overload during mass unlock events
- **Observability**: OpenTelemetry distributed tracing, Jaeger/OTLP exporters
- **Cache Invalidation**: Event-driven cache management for cap table updates
- **Rate Limiting**: Wallet-based rate limiting with configurable thresholds
- **GraphQL API**: Apollo Server with subscriptions support

## Configuration

Key environment variables (see `backend/.env.example`):

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vesting_vault
DB_USER=postgres
DB_PASSWORD=password

# Stellar
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Future Network ; October 2022

# Circuit Breaker (optional)
DATABASE_CIRCUIT_BREAKER_FAILURE_THRESHOLD=15
DATABASE_CIRCUIT_BREAKER_MASS_UNLOCK_THRESHOLD=50
```

## Architecture

### Circuit Breaker System

Protects database writes during mass unlock events with 4 states:
- **CLOSED**: Normal operation
- **THROTTLING**: High load detected, probabilistic throttling
- **OPEN**: Failure threshold exceeded, operations rejected
- **HALF_OPEN**: Recovery testing with limited operations

### Asset Decimal Normalizer

Handles cross-asset precision for Stellar tokens:
- XLM (7 decimals), USDC/EURC (6), BTC/wBTC (8), ETH/wETH (18)

### Observability Stack

- **OpenTelemetry**: Distributed tracing for API, Redis, PostgreSQL
- **Prometheus**: Metrics collection via prom-client
- **Circuit Breaker Monitor**: Real-time alerting (email, Slack)

## Documentation

- [Contributing Guide](CONTRIBUTING.md)
- [Issue Solutions Summary](ISSUE_SOLUTIONS.md) - Resolved issues #250, #256, #258
- [Backend Setup Guide](backend/SETUP_GUIDE.md)
- [Vesting History API](backend/README_VESTING_HISTORY_API.md)
- [DLQ System](backend/README_DLQ_SYSTEM.md)
- [Ledger Reorg Handling](backend/README_LEDGER_REORG_HANDLING.md)
- [Soroban Event Poller](backend/README_SOROBAN_EVENT_POLLER.md)
- [Database Circuit Breaker](DATABASE_CIRCUIT_BREAKER_README.md)
- [Asset Decimal Normalizer](ASSET_DECIMAL_NORMALIZER_README.md)
- [Off-Ramp Integration](backend/docs/OFF_RAMP_INTEGRATION.md)

## License

MIT
