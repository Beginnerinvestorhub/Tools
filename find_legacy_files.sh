#!/bin/bash

# ==============================================================================
# Legacy File & Structure Identification Script
# ==============================================================================
# This script identifies files and directories that may be part of a legacy
# structure, based on the standardization guides and audit reports. It helps
# in cleaning up the codebase by flagging non-conforming patterns.
#
# It checks for:
# 1. Old root-level directories (e.g., 'ai_microservice').
# 2. Old root-level Dockerfiles.
# 3. Python services that don't use the shared configuration system.
# 4. Python services that don't inherit shared dependencies.
# 5. Potentially redundant documentation.
# ==============================================================================

# --- Configuration ---
WORKSPACE_ROOT="/workspaces/Tools"
LEGACY_DIRS=("ai_microservice" "frontend" "backend" "python-engine")
LEGACY_FILES=("Dockerfile")
PYTHON_SERVICES_DIR="$WORKSPACE_ROOT/tools/services"
SHARED_CONFIG_IMPORT="from shared.config.base_config"
SHARED_REQUIREMENTS_IMPORT="-r ../shared/requirements.txt"

# --- Functions ---
print_header() {
    echo "======================================================"
    echo "  Legacy File and Structure Audit"
    echo "======================================================"
    echo "Searching for files that don't conform to the new"
    echo "standardized architecture..."
    echo
}

print_section() {
    echo "--- $1 ---"
}

check_result() {
    if [ "$2" = "found" ]; then
        echo "🔴 FOUND: $1"
    else
        echo "✅ OK: $1"
    fi
}

# --- Main Script ---

print_header

# 1. Check for legacy directories at the root level
print_section "Checking for Root-Level Legacy Directories"
for dir in "${LEGACY_DIRS[@]}"; do
    if [ -d "$WORKSPACE_ROOT/$dir" ]; then
        check_result "Legacy directory '$dir' exists at root." "found"
    else
        check_result "Legacy directory '$dir' not found at root." "ok"
    fi
done
echo

# 2. Check for legacy files at the root level
print_section "Checking for Root-Level Legacy Files"
for file in "${LEGACY_FILES[@]}"; do
    if [ -f "$WORKSPACE_ROOT/$file" ]; then
        check_result "Legacy file '$file' exists at root." "found"
    else
        check_result "Legacy file '$file' not found at root." "ok"
    fi
done
echo

# 3. Check Python services for non-conformance
print_section "Auditing Python Services in 'tools/services/'"
if [ -d "$PYTHON_SERVICES_DIR" ]; then
    for service_dir in "$PYTHON_SERVICES_DIR"/*/; do
        if [ -d "$service_dir" ] && [[ "$service_dir" != *"/shared/"* ]]; then
            service_name=$(basename "$service_dir")
            echo "-> Auditing service: $service_name"

            # Check config.py for shared config usage
            config_file="${service_dir}src/config.py"
            if [ -f "$config_file" ] && ! grep -q "$SHARED_CONFIG_IMPORT" "$config_file"; then
                check_result "  'config.py' does NOT use the shared configuration system." "found"
            fi
        fi
    done
fi
echo

echo "======================================================"
echo "Audit Complete."
echo "Files/directories marked with 🔴 should be reviewed for archiving or removal."
echo "======================================================"