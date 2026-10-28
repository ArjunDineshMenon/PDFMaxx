@echo off
title PDFMaxx Build ^& Launch
cd /d "%~dp0"

echo.
echo   PDFMaxx — Build ^& Launch
echo   ============================

echo [1/2] Building self-contained PDFMaxx.exe...
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python desktop\build_standalone.py
) else (
    echo       Python not found. Attempting manual build with csc...
    set CSC64=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
    set CSC32=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe
    set CSC_EXE=
    if exist "%CSC64%" set CSC_EXE=%CSC64%
    if not defined CSC_EXE if exist "%CSC32%" set CSC_EXE=%CSC32%
    if defined CSC_EXE (
        "%CSC_EXE%" /target:winexe /out:PDFMaxx.exe /resource:index.html,PDFMaxx.index.html /win32icon:desktop\pdfmaxx.ico /r:System.Windows.Forms.dll /optimize+ desktop\PDFMaxxDesktop.cs
        if exist "dist\" copy /y PDFMaxx.exe dist\PDFMaxx.exe >nul
    ) else (
        echo ERROR: Neither Python nor C# compiler found.
        pause
        exit /b 1
    )
)

echo [2/2] Launching PDFMaxx...
start "" "%~dp0PDFMaxx.exe"
