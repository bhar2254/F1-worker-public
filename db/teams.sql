DROP TABLE IF EXISTS teams;
CREATE TABLE IF NOT EXISTS teams (
    teamId INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name TEXT NOT NULL,
    primary_color TEXT,
    secondary_color TEXT,
    tertiary_color TEXT,
    country TEXT,
    first_entry_year INTEGER,
    last_entry_year INTEGER,
    constructors_championships INTEGER,
    drivers_championships INTEGER
);

-- Insert data into the f1_historic_teams table
INSERT INTO teams (team_name, primary_color, secondary_color, tertiary_color, country, first_entry_year, last_entry_year, constructors_championships, drivers_championships) VALUES 
('Red Bull Racing', 'EC1845', 'FED502', '8D8F93', 'Austria', 2005, NULL, 5, 6),
('Mercedes-AMG Petronas', 'C8CCCE', '00A19B', '565F64', 'Germany', 2010, NULL, 8, 7),
('Ferrari', 'EF1A2D', 'FFF200', '000000', 'Italy', 1950, NULL, 16, 15),
('McLaren', 'FF8000', '000000', '000000', 'United Kingdom', 1966, NULL, 8, 12),
('Williams', '00A0DE', '000000', '000000', 'United Kingdom', 1977, NULL, 9, 7),
('Alpine', '02192B', '2173B8', 'FFFFFF', 'France', 1977, NULL, 2, 2),
('Honda', '000000', 'FFFFFF', '000000', 'Japan', 1964, 2008, 0, 0),
('Alfa Romeo', '241F21', 'A42134', 'E12319', 'Italy', 1950, 1985, 0, 2),
('Aston Martin', '002420', 'FFFFFF', '000000', 'United Kingdom', 2021, NULL, 0, 0),
('Lotus', '231F20', '86995B', '000000', 'United Kingdom', 1958, 1994, 7, 6),
('AlphaTauri', '6692FF', '000000', '000000', 'Italy', 2020, NULL, 0, 0),
('Toro Rosso', '00144A', 'EC0742', 'A39064', 'Italy', 2006, 2019, 0, 0),
('Benetton', '000000', 'FFFFFF', '000000', 'United Kingdom', 1986, 2001, 1, 2),
('Kick Sauber', '52E252', 'FFFFFF', '000000', 'Switzerland', 1993, NULL, 0, 0),
('Force India', '000000', 'FFFFFF', '000000', 'India', 2008, 2018, 0, 0),
('Racing Point', '000000', 'FFFFFF', '000000', 'United Kingdom', 2019, 2020, 0, 0),
('Jordan', '000000', 'FFFFFF', '000000', 'Ireland', 1991, 2005, 0, 0),
('Ligier', '000000', 'FFFFFF', '000000', 'France', 1976, 1996, 0, 0),
('Minardi', '000000', 'FFFFFF', '000000', 'Italy', 1985, 2005, 0, 0),
('Brawn GP', '000000', 'FFFFFF', '000000', 'United Kingdom', 2009, 2009, 1, 1),
('Brabham', '000000', 'FFFFFF', '000000', 'United Kingdom', 1962, 1992, 2, 4),
('Toyota', '000000', 'FFFFFF', '000000', 'Japan', 2002, 2009, 0, 0),
('Manor Marussia', '000000', 'FFFFFF', '000000', 'United Kingdom', 2010, 2016, 0, 0),
('Haas', 'E6002B', 'FFFFFF', '000000', 'United States', 2016, NULL, 0, 0);