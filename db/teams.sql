DROP TABLE IF EXISTS teams;
CREATE TABLE IF NOT EXISTS teams (
    teamId INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name TEXT NOT NULL,
    team_color TEXT,
    country TEXT,
    first_entry_year INTEGER,
    last_entry_year INTEGER,
    constructors_championships INTEGER,
    drivers_championships INTEGER
);

-- Insert data into the f1_historic_teams table
INSERT INTO teams (team_name, team_color, country, first_entry_year, last_entry_year, constructors_championships, drivers_championships) VALUES 
('Red Bull Racing', '3671C6', 'Austria', 2005, NULL, 5, 6),
('Mercedes-AMG Petronas', '27F4D2', 'Germany', 2010, NULL, 8, 7),
('Ferrari', 'E80020', 'Italy', 1950, NULL, 16, 15),
('McLaren', 'FF8000', 'United Kingdom', 1966, NULL, 8, 12),
('Williams', '64C4FF', 'United Kingdom', 1977, NULL, 9, 7),
('Alpine', '0093cc', 'France', 1977, NULL, 2, 2),
('Honda', '000000', 'Japan', 1964, 2008, 0, 0),
('Alfa Romeo', '000000', 'Italy', 1950, 1985, 0, 2),
('Aston Martin', '229971', 'United Kingdom', 2021, NULL, 0, 0),
('Lotus', '000000', 'United Kingdom', 1958, 1994, 7, 6),
('AlphaTauri', '6692FF', 'Italy', 2020, NULL, 0, 0),
('Toro Rosso', '000000', 'Italy', 2006, 2019, 0, 0),
('Benetton', '000000', 'United Kingdom', 1986, 2001, 1, 2),
('Kick Sauber', '52E252', 'Switzerland', 1993, NULL, 0, 0),
('Force India', '000000', 'India', 2008, 2018, 0, 0),
('Racing Point', '000000', 'United Kingdom', 2019, 2020, 0, 0),
('Jordan', '000000', 'Ireland', 1991, 2005, 0, 0),
('Ligier', '000000', 'France', 1976, 1996, 0, 0),
('Minardi', '000000', 'Italy', 1985, 2005, 0, 0),
('Brawn GP', '000000', 'United Kingdom', 2009, 2009, 1, 1),
('Brabham', '000000', 'United Kingdom', 1962, 1992, 2, 4),
('Toyota', '000000', 'Japan', 2002, 2009, 0, 0),
('Manor Marussia', '000000', 'United Kingdom', 2010, 2016, 0, 0),
('Haas', 'B6BABD', 'United States', 2016, NULL, 0, 0);