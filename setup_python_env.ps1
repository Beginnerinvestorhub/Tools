# setup_python_env.ps1
Write-Host "Setting up Python virtual environment for the service..." -ForegroundColor Green

# Check if python is available
$pythonExists = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $pythonExists) {
    Write-Host "ERROR: Python is not found in your PATH." -ForegroundColor Red
    Write-Host "Please install Python and ensure it is added to your system's PATH." -ForegroundColor Red
    exit 1
}

# Step 1: Create virtual environment
Write-Host "[1/4] Creating virtual environment in .venv..."
if (Test-Path .venv) {
    Write-Host "Virtual environment .venv already exists. Re-creating to ensure it's clean."
    Remove-Item -Path ".venv" -Recurse -Force
}
python -m venv .venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create virtual environment." -ForegroundColor Red
    exit 1
}

$VenvPython = ".\.venv\Scripts\python.exe"

# Step 2: Upgrade pip
Write-Host "[2/4] Upgrading pip..."
& $VenvPython -m pip install --upgrade pip --quiet

# Step 3: Install requirements
Write-Host "[3/4] Installing dependencies from requirements.txt..."
& $VenvPython -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies. Please check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host "[4/4] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " To activate the environment in your PowerShell terminal, run:" -ForegroundColor Cyan
Write-Host " .\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan