# Harlequin AR.IO Explorer Sidecar

A high-performance sidecar service for AR.IO gateways that processes webhook messages and maintains real-time parquet datasets for the Harlequin AR.IO Explorer.

## Features

- **Real-time Transaction Processing**: Receives webhook messages from AR.IO gateways
- **Parquet Data Management**: Efficiently stores and manages columnar data in parquet format
- **Automatic Checkpointing**: Daily deployment of parquet files to Arweave with catalog management
- **Multiple Data Types**: Supports ArNS names, transactions, ANT registry, AO processes, and messages
- **RESTful API**: Comprehensive API for data access and management
- **Production Ready**: Docker support, health checks, and monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional)
- Arweave wallet (for checkpointing)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup wallet** (optional, for checkpointing):
   ```bash
   mkdir -p config
   # Place your Arweave wallet JSON in config/wallet.json
   ```

4. **Start the service**:
   ```bash
   npm run dev  # Development
   npm start    # Production
   ```

### Docker Setup

1. **Build and run**:
   ```bash
   docker-compose up -d
   ```

2. **View logs**:
   ```bash
   docker-compose logs -f harlequin-sidecar
   ```

## API Endpoints

### Health & Status
- `GET /health` - Service health check
- `GET /webhook/status` - Webhook processing status

### Webhook Processing
- `POST /webhook/transaction` - Process single transaction
- `POST /webhook/block` - Process block with multiple transactions
- `POST /webhook/test` - Test transaction processing

### Parquet Data Access
- `GET /harlequin/parquet/:table` - Download parquet file
- `GET /harlequin/tables` - List all tables with metadata
- `GET /harlequin/metadata/:table` - Get table metadata
- `GET /harlequin/schema/:table` - Get table schema
- `POST /harlequin/query/:table` - Query table data

### Data Management
- `POST /checkpoint` - Trigger manual checkpoint
- `POST /flush` - Flush all buffers to parquet files

### Catalog Management
- `GET /harlequin/catalog` - Get catalog information
- `GET /harlequin/catalog/balance` - Check wallet balance
- `POST /harlequin/catalog/deploy` - Manual catalog deployment
- `GET /harlequin/catalog/validate` - Validate configuration

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `PARQUET_BATCH_SIZE` | `1000` | Records per batch |
| `CHECKPOINT_INTERVAL` | `"0 2 * * *"` | Cron schedule for checkpoints |
| `FLUSH_INTERVAL` | `"*/5 * * * *"` | Cron schedule for buffer flush |
| `ARWEAVE_HOST` | `arweave.net` | Arweave gateway host |
| `ARWEAVE_WALLET_PATH` | `./config/wallet.json` | Path to Arweave wallet |
| `ARNS_NAME` | `harlequin-data` | ArNS name for catalog |
| `AUTO_UPDATE_ARNS` | `false` | Auto-update ArNS on checkpoint |

### Supported Data Types

The sidecar automatically classifies and processes these transaction types:

- **ArNS Names**: Name registrations and updates
- **ArNS Records**: DNS record management
- **ANT Registry**: ANT process registrations
- **AO Processes**: Process spawning transactions
- **AO Messages**: Message transactions
- **General Transactions**: All other transactions

## Webhook Integration

### AR.IO Gateway Configuration

Configure your AR.IO gateway to send webhooks to the sidecar:

```yaml
# gateway-config.yml
webhooks:
  transaction_url: "http://harlequin-sidecar:3001/webhook/transaction"
  block_url: "http://harlequin-sidecar:3001/webhook/block"
```

### Transaction Webhook Format

```json
{
  "transaction_id": "abc123...",
  "owner": "owner_address",
  "target": "target_address",
  "tags": [
    {"name": "App-Name", "value": "ArNS"},
    {"name": "Action", "value": "Buy-Record"}
  ],
  "data_size": 1024,
  "block_height": 1000000,
  "block_timestamp": 1640995200,
  "fee": 1000000
}
```

## Data Schema

### ArNS Names Table
- `name`: ArNS name
- `owner`: Owner address
- `target`: Target Arweave ID
- `ttl_seconds`: Time to live
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `block_height`: Block height
- `transaction_id`: Transaction ID

### Transactions Table
- `id`: Transaction ID
- `owner`: Owner address
- `target`: Target address
- `data_size`: Data size in bytes
- `block_height`: Block height
- `block_timestamp`: Block timestamp
- `fee`: Transaction fee
- `tags`: JSON string of tags
- `app_name`: Application name

## Checkpointing

The sidecar automatically creates daily checkpoints:

1. **Flush Buffers**: All pending data is written to parquet files
2. **Upload Files**: Parquet files are uploaded to Arweave
3. **Create Catalog**: A data catalog is generated with file locations
4. **Update ArNS**: The ArNS name is updated to point to the new catalog

### Manual Checkpointing

```bash
curl -X POST http://localhost:3001/checkpoint
```

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

### Table Statistics

```bash
curl http://localhost:3001/harlequin/tables
```

### Webhook Status

```bash
curl http://localhost:3001/webhook/status
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Production Deployment

### Docker Compose (Recommended)

```bash
# Production deployment with nginx proxy
docker-compose --profile production up -d
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests.

### Monitoring & Logging

- Health checks are built-in
- Structured logging with Pino
- Prometheus metrics (TODO)
- Grafana dashboards (TODO)

## Troubleshooting

### Common Issues

1. **Parquet files not being created**
   - Check write permissions on `./data` directory
   - Verify transactions are being received via webhooks

2. **Checkpoint deployment fails**
   - Ensure wallet is configured and has sufficient AR balance
   - Check Arweave gateway connectivity

3. **High memory usage**
   - Reduce `PARQUET_BATCH_SIZE`
   - Increase `FLUSH_INTERVAL` frequency

### Logs

```bash
# Docker logs
docker-compose logs -f harlequin-sidecar

# Local logs
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
