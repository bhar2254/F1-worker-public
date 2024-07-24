@echo off
setlocal

REM Set the directory containing the .sql files
set "sqlDirectory=.\db"

REM Change to the specified directory
cd /d "%sqlDirectory%"

REM Loop through each .sql file in the directory
for %%f in (*.sql) do (
    echo Processing %%f
    wrangler d1 execute f1-ergast-clone --file="./db/%%f"
)

endlocal