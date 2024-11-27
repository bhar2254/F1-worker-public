//  scheduledHandler

import { Hono } from 'hono'; // If using Hono framework

const BASE_API_URL = 'https://api.openf1.org/v1/results'; // Replace with your API endpoint

export default {
  async scheduled(event, env, ctx) {
    try {
      // Calculate date range for the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Build API URL with date range query parameters
      const url = `${BASE_API_URL}?start_date=${startDateStr}&end_date=${endDateStr}`;

      // Fetch race results from the external API
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch race results: ${response.statusText}`);
        return;
      }

      // Parse JSON response
      const raceResults = await response.json();

      // Process and store the data (example for D1 database)
      const db = env.DB; // Access your Cloudflare D1 database binding
      for (const result of raceResults) {
        const query = `
          INSERT OR REPLACE INTO race_results (raceId, driverId, position, points, raceDate)
          VALUES (?, ?, ?, ?, ?)
        `;
        await db.prepare(query)
          .bind(
            result.raceId,
            result.driverId,
            result.position,
            result.points,
            result.date
          )
          .run();
      }

      console.log('Race results successfully fetched and stored.');
    } catch (error) {
      console.error('Error fetching race results:', error);
    }
  }
};
