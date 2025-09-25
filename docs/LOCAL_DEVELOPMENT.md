# Local Development with AR-IO Node

This guide explains how to set up and run a local AR-IO node for development with the AR-IO Explorer application.

## Overview

The local development setup includes:

- **AR-IO Node**: A local instance of the AR-IO gateway node
- **Redis**: For caching and performance optimization
- **Automatic Configuration**: The app automatically detects and uses the local node when running on localhost

## Prerequisites

Before starting, ensure you have the following installed:

- **Docker**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Docker Compose**: Usually included with Docker Desktop
- **Git**: For cloning repositories
- **Node.js & pnpm**: For running the AR-IO Explorer app

## Quick Start

### 1. Start the Local AR-IO Node

Run the startup script to launch the local AR-IO node:

```bash
./scripts/start-local-node.sh
```

This script will:

- Check if Docker is running
- Create environment configuration if needed
- Build the AR-IO node from source (first run may take several minutes)
- Start the AR-IO node and Redis containers
- Wait for services to be ready
- Display service URLs and useful commands

**Note**: The first time you run this, it will build the AR-IO node Docker image from the GitHub repository, which may take 5-10 minutes depending on your internet connection and system performance.

### 2. Start the AR-IO Explorer App

In a separate terminal, start the Explorer application:

```bash
pnpm install
pnpm dev
```

The app will automatically detect that it's running on localhost and use the local AR-IO node.

### 3. Verify the Setup

- **AR-IO Node API**: http://localhost:4000
- **Node Info**: http://localhost:4000/ar-io/info
- **GraphQL Endpoint**: http://localhost:3000/graphql
- **Explorer App**: http://localhost:3000 (or your configured port)

## Manual Setup

If you prefer to set up manually:

### 1. Create Environment File

Copy the example environment file:

```bash
cp docker-env.example .env
```

Edit `.env` to customize configuration if needed.

### 2. Start Services

```bash
docker-compose up -d
```

### 3. Check Logs

```bash
docker-compose logs -f ar-io-node
```

## Configuration

### Environment Variables

The local setup uses these key environment variables:

```bash
# AR-IO Node Configuration
GRAPHQL_HOST=arweave.net
GRAPHQL_PORT=443
START_HEIGHT=1000000
ARNS_ROOT_HOST=localhost

# Performance Settings
PARALLEL_CHUNK_DOWNLOAD_LIMIT=10
MAX_FORK_DEPTH=50

# Development Settings
NODE_ENV=development
LOG_LEVEL=info
RUN_OBSERVER=false
```

### App Configuration

The AR-IO Explorer automatically configures itself for local development:

- **Gateway URL**: `http://localhost:4000`
- **Database URL**: `http://localhost:4000/graphql`
- **CU URL**: `http://localhost:4000`
- **Fallback**: Automatically falls back to production endpoints if local node is unavailable

## Services

### AR-IO Node (Port 4000)

The main AR-IO gateway node provides:

- Transaction and block data
- GraphQL API
- ARNS resolution
- Data retrieval and caching

**Key Endpoints:**

- `/ar-io/info` - Node information
- `/graphql` - GraphQL API
- `/tx/{id}` - Transaction data
- `/{id}` - Data retrieval

### Redis (Port 6379)

Redis provides caching for improved performance:

- Query result caching
- Session storage
- Rate limiting data

## Data Storage

The setup uses Docker volumes for persistent data:

- `ar-io-data`: Node data (SQLite, chunks, headers)
- `ar-io-logs`: Application logs
- `redis-data`: Redis cache data

### Data Locations

Inside the container:

- SQLite database: `/app/data/sqlite`
- Chunk data: `/app/data/chunks`
- Headers: `/app/data/headers`
- Logs: `/app/logs`
- Datasets: `/data/datasets` (mounted from `./fixtures/parquet/datasets`)

### Local Datasets

The setup automatically mounts your local `./fixtures/parquet/datasets` directory to the AR-IO node's `/data/datasets` folder. This allows the node to access pre-existing parquet data files for:

- **Blocks data**: Transaction block information
- **Tags data**: Transaction tags and metadata
- **Transactions data**: Transaction details and content

The datasets are mounted as read-only to prevent accidental modification.

## Management Commands

### Start Services

```bash
./scripts/start-local-node.sh
# or
docker-compose up -d
```

### Stop Services

```bash
./scripts/stop-local-node.sh
# or
docker-compose down
```

### View Logs

```bash
docker-compose logs -f ar-io-node
docker-compose logs -f redis
```

### Restart Services

```bash
docker-compose restart
```

### Clean Up (Remove All Data)

```bash
docker-compose down -v
```

## Troubleshooting

### Node Not Starting

1. **Check Docker Status**:

   ```bash
   docker info
   ```

2. **Check Logs**:

   ```bash
   docker-compose logs ar-io-node
   ```

3. **Verify Ports**:
   Ensure ports 4000 and 3000 are not in use by other applications.

### App Not Using Local Node

1. **Check URL**: Verify the app is running on `localhost` or `127.0.0.1`
2. **Check Node Status**: Visit http://localhost:4000/ar-io/info
3. **Check Console**: Look for fallback messages in browser console

### Performance Issues

1. **Increase Resources**: Allocate more memory/CPU to Docker
2. **Adjust Settings**: Modify `PARALLEL_CHUNK_DOWNLOAD_LIMIT` in docker-compose.yml
3. **Monitor Logs**: Check for error messages in node logs

### Network Issues

1. **Firewall**: Ensure Docker can access external networks
2. **DNS**: Verify DNS resolution is working
3. **Proxy**: Check if corporate proxy is interfering

## Development Workflow

### Typical Development Session

1. **Start Local Node**:

   ```bash
   ./scripts/start-local-node.sh
   ```

2. **Start Explorer App**:

   ```bash
   pnpm dev
   ```

3. **Develop and Test**: Make changes to the Explorer app
4. **Monitor Logs**: Keep an eye on both app and node logs
5. **Stop When Done**:
   ```bash
   ./scripts/stop-local-node.sh
   ```

### Testing Different Configurations

You can test different node configurations by:

1. Stopping the services
2. Modifying `docker-compose.yml` or `.env`
3. Restarting the services

### Switching Between Local and Production

The app automatically switches based on hostname, but you can manually override in the Settings page:

1. Open AR-IO Explorer
2. Go to Settings
3. Modify the Gateway URL and other endpoints
4. Save changes

## Advanced Configuration

### Custom Start Height

To start indexing from a specific block height:

```yaml
environment:
  - START_HEIGHT=1500000 # Start from block 1,500,000
```

### Enable Observer Mode

For testing observer functionality:

```yaml
environment:
  - RUN_OBSERVER=true
  - AR_IO_WALLET=your-wallet-address
  - OBSERVER_WALLET=observer-wallet-address
```

### Custom Domain

To test with a custom domain:

```yaml
environment:
  - ARNS_ROOT_HOST=mylocal.domain
```

Then add to your `/etc/hosts`:

```
127.0.0.1 mylocal.domain
```

## Performance Optimization

### Resource Allocation

Increase Docker resources for better performance:

- **Memory**: 4GB+ recommended
- **CPU**: 2+ cores recommended
- **Disk**: SSD recommended for data volumes

### Configuration Tuning

```yaml
environment:
  - PARALLEL_CHUNK_DOWNLOAD_LIMIT=20 # Increase for faster downloads
  - MAX_FORK_DEPTH=100 # Handle deeper forks
  - ENABLE_FS_HEADER_CACHE_CLEANUP=true # Clean up cache regularly
```

## Security Considerations

### Local Development Only

This setup is designed for local development only:

- Uses HTTP (not HTTPS)
- Has permissive CORS settings
- Observer mode disabled by default
- No authentication required

### Production Deployment

For production deployment, consider:

- HTTPS configuration
- Proper CORS settings
- Authentication and authorization
- Monitoring and alerting
- Backup strategies

## Support

If you encounter issues:

1. **Check Documentation**: Review this guide and the main README
2. **Check Logs**: Always check Docker and application logs
3. **GitHub Issues**: Report bugs on the AR-IO Explorer repository
4. **Community**: Join the AR-IO Discord for community support

## Contributing

To contribute improvements to the local development setup:

1. Fork the repository
2. Make your changes
3. Test thoroughly with the local setup
4. Submit a pull request

---

**Happy developing with AR-IO! 🚀**
