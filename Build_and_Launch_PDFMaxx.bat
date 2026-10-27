@echo off
title "PDFMaxx Build & Launch"
cd /d "%~dp0"

echo.
echo   PDFMaxx — Build ^& Launch
echo   ============================

echo [1/2] Building self-contained PDFMaxx.exe...
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python desktop\build_standalone.py
) else (
    echo       Python not found. Attempting manual build...
    python desktop\build_exe.py 2>nul
    set CSC64=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
    set CSC32=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe
    if exist "%CSC64%" (
        "%CSC64%" /target:winexe /out:PDFMaxx.exe /r:System.Windows.Forms.dll /optimize+ desktop\PDFMaxxDesktop.cs >nul
    ) else if exist "%CSC32%" (
        "%CSC32%" /target:winexe /out:PDFMaxx.exe /r:System.Windows.Forms.dll /optimize+ desktop\PDFMaxxDesktop.cs >nul
    )
)

echo [2/2] Launching PDFMaxx...
start "" "%~dp0PDFMaxx.exe"
