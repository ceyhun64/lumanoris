@REM @echo off
@REM REM Next.js frontend'i başlat
@REM start cmd /k "npm run dev"

@REM REM PHP backend'i başlat (built-in server)
@REM start cmd /k "php -S localhost:8000 -t src"

@echo off
REM PHP backend'i başlat
start cmd /k "php -S localhost:8000 -t src/php"

REM Next.js custom server'i başlat
start cmd /k "nodemon server.js"