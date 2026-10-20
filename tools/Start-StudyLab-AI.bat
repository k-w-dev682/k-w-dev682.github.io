@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Nie znaleziono Node.js w PATH. Zainstaluj Node.js 22 lub nowszy.
  pause
  exit /b 1
)
echo Uruchamianie lokalnego Gemini API dla StudyLab...
echo Klucz zostanie wczytany z .env i NIE bedzie przesylany do przegladarki.
echo Zostaw to okno otwarte podczas formatowania dokumentow.
node tools\studylab-gemini-server.mjs
if errorlevel 1 (
  echo Wystapil blad uruchomienia serwera. Sprawdz GEMINI_API_KEY w .env.
  pause
  exit /b 1
)
