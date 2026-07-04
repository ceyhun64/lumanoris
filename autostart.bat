@echo off
REM PHP backend'i başlat (api/ klasöründen)
start cmd /k "php -S localhost:8000 -t api"

REM Next.js custom server'i başlat (web/ klasöründen)
start cmd /k "cd web && nodemon server.js"