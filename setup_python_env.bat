@echo off
echo Setting up Python virtual environment for the service...

REM Check if python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not found in your PATH.
    echo Please install Python and ensure it is added to your system's PATH.
    exit /b 1
)

REM Step 1: Create virtual environment
echo [1/4] Creating virtual environment in .venv...
if exist .venv (
    echo Virtual environment .venv already exists. Re-creating to ensure it's clean.
    rmdir /s /q .venv
)
python -m venv .venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment.
    exit /b 1
)

REM Step 2: Activate it (This script will run commands within the venv context)
echo [2/4] Activating environment...
call .venv\Scripts\activate.bat

REM Step 3: Upgrade pip
echo [3/4] Upgrading pip...
python -m pip install --upgrade pip >nul

REM Step 4: Install requirements
echo [4/4] Installing dependencies from requirements.txt...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies. Please check the error messages above.
    exit /b 1
)

echo.
echo =================================================================
echo  Setup complete!
echo  To activate the environment in your terminal, run:
echo  .\.venv\Scripts\activate
echo =================================================================