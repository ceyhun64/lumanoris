@echo off
REM PHP backend. Two things matter here and both used to be wrong:
REM  1) router.php must be passed — without it api/router.php never runs, and
REM     the URI decoding/rewriting it does is skipped, so pretty admin URLs and
REM     any encoded path break. package.json's dev:all always used the router;
REM     this file did not, so the two recipes behaved differently.
REM  2) bind 127.0.0.1, not "localhost". On Windows localhost resolves to ::1
REM     first, which left PHP listening on IPv6 only while the Node server binds
REM     IPv4 — the proxy then could not reach it.
start cmd /k "cd api && php -S 127.0.0.1:8000 router.php"

REM Next.js custom server (web/ klasöründen)
start cmd /k "cd web && nodemon server.js"
