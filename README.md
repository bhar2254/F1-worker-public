# F1 Worker: Ergast Database Clone

F1 Worker is a Cloudflare Workers-powered project designed to emulate the popular [Ergast F1 database](https://ergast.com/mrd/) by providing efficient, fast, and easy-to-use Formula 1 data APIs. This project aims to deliver a seamless experience for accessing historical and real-time F1 data.

## Features

- **Fast API Response Times:** Leveraging Cloudflare Workers' edge computing capabilities to ensure low-latency data access globally.
- **Ergast-Compatible Endpoints:** Replicates the structure and functionality of the Ergast API for compatibility.
- **Weekly Data Updates:** Scheduled data updates to keep race results and statistics current.
- **Statistical Queries:** Access to comprehensive F1 data, including race results, driver standings, and lap times.

## Prerequisites

- **Node.js** (v16 or higher)
- **Wrangler CLI** (for Cloudflare Workers)

### Install Wrangler
```bash
npm install -g wrangler
```

## Project Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/f1-worker.git
   cd f1-worker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Authenticate with Cloudflare:**
   ```bash
   wrangler login
   ```

4. **Configure environment variables:**
   Update the `wrangler.toml` file with your Cloudflare account details and API tokens.

## Local Development

1. **Run the development server:**
   ```bash
   wrangler dev
   ```

2. **Access the API locally:**
   Your API will be available at `http://127.0.0.1:8787`.

## Deployment

1. **Deploy to Cloudflare Workers:**
   ```bash
   wrangler publish
   ```

2. **Verify your deployment:**
   Access your deployed API at `https://<worker-name>.<your-subdomain>.workers.dev`.

## API Endpoints

### Example Endpoints:
- **Race Results:** `/api/results/:season/:round`
- **Driver Standings:** `/api/standings/:season`
- **Fastest Laps:** `/api/laps/fastest/:season/:round`

### Usage Example:
```bash
curl https://<your-worker-url>/api/results/2023/5
```

## Data Sources

F1 data is fetched and updated weekly from reliable sources, ensuring accuracy and completeness in line with the Ergast API.

## Roadmap

- **Live Data Integration:** Real-time race data streaming.
- **Enhanced Query Filters:** Improved filtering and sorting options for race statistics.
- **Data Visualization:** Interactive visual representation of F1 stats.

## Resources

- [Ergast Motor Racing Data API](https://ergast.com/mrd/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Formula 1 Official Site](https://www.formula1.com/)