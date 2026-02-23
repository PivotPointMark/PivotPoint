@echo off
setlocal EnableDelayedExpansion

set OUTPUT=output.txt

:: töröljük ha létezik
if exist "%OUTPUT%" del "%OUTPUT%"

:: CSS fájlok
if exist css (
    for /r css %%F in (*) do (
        call :process_file "%%F"
    )
)

:: JS fájlok
if exist js (
    for /r js %%F in (*) do (
        call :process_file "%%F"
    )
)

:: Gyökér html fájlok
for %%F in (*.html) do (
    call :process_file "%%F"
)

echo Kész! Az osszes fajl tartalma az %OUTPUT% fajlba kerult.
exit


:process_file
set FILE=%~1
set NAME=%~nx1

:: .gitattributes kihagyasa
if /I "%NAME%"==".gitattributes" exit /b

:: .github mappa kizárása
echo %FILE% | findstr /I "\.github\" >nul
if not errorlevel 1 exit /b

(
echo ********************************************
echo ********************************************
echo %NAME%
echo ********************************************
echo ********************************************
type "%FILE%"
echo.
echo.
) >> "%OUTPUT%"

exit /b
