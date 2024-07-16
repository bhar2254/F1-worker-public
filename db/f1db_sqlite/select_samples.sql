SELECT 
	driver_standings.*,
	drivers.forename || ' ' || drivers.surname AS full_name,
	drivers.code,
	races.year,
	races.round
FROM 
	driver_standings
JOIN 
	drivers ON driver_standings.driverId = drivers.driverId
JOIN 
	races ON driver_standings.raceId = races.raceId
WHERE 
	races.year = 2024
ORDER BY 
	CAST(driver_standings.raceId AS INTEGER) DESC;