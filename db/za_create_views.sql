DROP VIEW IF EXISTS driver_constructor_standings;
CREATE VIEW driver_constructor_standings AS
SELECT drivers.*,
	drivers.forename || ' ' || drivers.surname AS full_name,
	driver_standings.position,
	MAX(driver_standings.points) AS points,
	constructors.name AS constructor_name,
	constructors.constructorRef,
	constructors.primary_color,
	constructors.secondary_color,
	constructors.tertiary_color,
	races.year
FROM drivers
	LEFT JOIN results ON results.driverId = drivers.driverId
	LEFT JOIN races ON races.raceId = results.raceId
	LEFT JOIN constructors ON results.constructorId = constructors.constructorId
	LEFT JOIN driver_standings ON driver_standings.raceId = races.raceId
	AND driver_standings.driverId = drivers.driverId
GROUP BY drivers.driverId,
	constructors.constructorId,
	races.year
ORDER BY points DESC;

DROP VIEW IF EXISTS driver_info;
CREATE VIEW driver_info AS
SELECT drivers.driverId,
	drivers.driverRef,
	drivers.surname,
	drivers.forename,
	drivers.nationality,
	drivers.forename || ' ' || drivers.surname AS full_name,
	drivers.code,
	drivers.number,
	driver_standings.position,
	driver_standings.points,
	constructors.name AS constructor_name,
	constructors.constructorRef,
	constructors.primary_color,
	constructors.secondary_color,
	constructors.tertiary_color,
	races.year
FROM drivers
	LEFT JOIN results ON drivers.driverId = results.driverId
	LEFT JOIN races ON races.raceId = results.raceId
	LEFT JOIN constructors ON results.constructorId = constructors.constructorId
	LEFT JOIN driver_standings ON drivers.driverId = driver_standings.driverId
GROUP BY full_name, races.year
ORDER BY driver_standings.driverStandingsId DESC,
	results.resultId DESC;

DROP VIEW IF EXISTS constructor_info;
CREATE VIEW constructor_info AS
SELECT constructors.*,
	constructor_standings.position AS position,
	MAX(constructor_standings.points) AS points,
	races.year
FROM constructors
	LEFT JOIN constructor_standings ON constructors.constructorId = constructor_standings.constructorId
	LEFT JOIN races ON races.raceId = constructor_standings.raceId
GROUP BY constructors.constructorId,
	races.year
ORDER BY constructor_standings.constructorStandingsId DESC;

DROP VIEW IF EXISTS constructor_drivers;
CREATE VIEW constructor_drivers AS
SELECT drivers.driverId,
	drivers.code,
	drivers.forename,
	drivers.surname,
	drivers.driverRef,
	drivers.nationality,
	constructors.constructorId,
	constructors.name AS constructor_name,
	constructor_standings.position AS constructor_position,
	driver_standings.position AS position,
	races.year AS year,
	MAX(constructor_standings.points) AS constructor_points,
	MAX(driver_standings.points) AS points
FROM results
	JOIN drivers ON drivers.driverId = results.driverId
	JOIN constructors ON constructors.constructorId = results.constructorId
	JOIN constructor_standings ON constructor_standings.constructorId = results.constructorId
		AND constructor_standings.raceId = results.raceId
	JOIN races ON races.raceId = results.raceId
	JOIN driver_standings ON driver_standings.driverId = results.driverId
		AND driver_standings.raceId = results.raceId
GROUP BY year, drivers.driverId
ORDER BY year DESC,
	points DESC;

DROP VIEW IF EXISTS driver_race_results;
CREATE VIEW driver_race_results AS
SELECT drivers.driverId,
	drivers.code,
	drivers.forename,
	drivers.surname,
	drivers.driverRef,
	drivers.nationality,
	races.raceId,
	races.name,
	races.year,
	races.date,
	races.url,
	results.number,
	results.position,
	results.positionText,
	results.points,
	results.time,
	results.fastestLap,
	results.fastestLapTime,
	results.rank
FROM results
	LEFT JOIN races ON results.raceId = races.raceId
	LEFT JOIN drivers ON drivers.driverId = results.driverId
GROUP BY races.raceId, races.year, drivers.driverId
ORDER BY races.raceId DESC;

DROP VIEW IF EXISTS basic_results;
CREATE VIEW basic_results AS
SELECT races.raceId,
	races.name,
	races.year,
	races.date,
	races.url,
	races.round
FROM results
	INNER JOIN races ON results.raceId = races.raceId
GROUP BY races.raceId, races.year
ORDER BY races.raceId DESC;

DROP VIEW IF EXISTS race_results;
CREATE VIEW race_results AS
SELECT drivers.driverId,
	drivers.code,
	drivers.forename,
	drivers.surname,
	drivers.driverRef,
	drivers.nationality,
	constructors.name AS constructor_name,
	races.raceId,
	races.name,
	races.year,
	races.date,
	races.url,
	results.number,
	results.position,
	results.positionText,
	results.points,
	results.time,
	results.fastestLap,
	results.fastestLapTime,
	results.rank
FROM results
	LEFT JOIN races ON results.raceId = races.raceId
	LEFT JOIN drivers ON drivers.driverId = results.driverId
	LEFT JOIN constructors ON constructors.constructorId = results.constructorId
GROUP BY races.raceId, races.year
ORDER BY races.raceId DESC;