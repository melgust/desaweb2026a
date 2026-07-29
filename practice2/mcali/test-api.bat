@echo off
REM Script de pruebas para la API REST
REM Asegúrate de que Docker está corriendo: docker-compose up -d

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo    Pruebas API REST - Gestión de Personas
echo ==========================================
echo.

set BASE_URL=http://localhost:8080/api/persons

REM 1. Crear persona 1
echo [1] Creando primera persona...
curl -X POST %BASE_URL% ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Juan Pérez\",\"birthday\":\"1998-06-15\",\"email\":\"juan@email.com\"}"
echo.
echo.

timeout /t 1 /nobreak

REM 2. Crear persona 2
echo [2] Creando segunda persona...
curl -X POST %BASE_URL% ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Ana López\",\"birthday\":\"1992-10-20\",\"email\":\"ana@email.com\"}"
echo.
echo.

timeout /t 1 /nobreak

REM 3. Obtener todas las personas
echo [3] Obteniendo todas las personas...
curl -X GET %BASE_URL%
echo.
echo.

timeout /t 1 /nobreak

REM 4. Obtener persona por ID
echo [4] Obteniendo persona con ID 1...
curl -X GET %BASE_URL%/1
echo.
echo.

timeout /t 1 /nobreak

REM 5. Obtener edad de una persona
echo [5] Obteniendo edad de persona con ID 1...
curl -X GET %BASE_URL%/1/age
echo.
echo.

timeout /t 1 /nobreak

REM 6. Actualizar persona
echo [6] Actualizando persona con ID 1...
curl -X PUT %BASE_URL%/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Juan Carlos Pérez\",\"email\":\"juancarlos@email.com\"}"
echo.
echo.

timeout /t 1 /nobreak

REM 7. Intentar acceder a persona que no existe
echo [7] Intentando obtener persona con ID 999 (no existe)...
curl -X GET %BASE_URL%/999
echo.
echo.

timeout /t 1 /nobreak

REM 8. Eliminar persona
echo [8] Eliminando persona con ID 2...
curl -X DELETE %BASE_URL%/2
echo.
echo.

timeout /t 1 /nobreak

REM 9. Verificar personas restantes
echo [9] Verificando personas restantes...
curl -X GET %BASE_URL%
echo.
echo.

echo ==========================================
echo    Pruebas completadas
echo ==========================================
echo.

pause
