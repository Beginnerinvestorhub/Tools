# services/ai-behavioral-nudge-engine/src/config.py
import os
from typing import cast

# This file is refactored to use the project's standardized configuration system,
# as defined in the PYTHON_SERVICES_CONSOLIDATION_GUIDE.md. This ensures
# consistency, reduces code duplication, and centralizes config management.
from shared.config.base_config import get_config, AIBehavioralConfig

# Ensure the SERVICE_NAME environment variable is set for the config factory.
# This is crucial for the factory to return the correct service-specific config class.
os.environ.setdefault("SERVICE_NAME", "ai-behavioral-nudge-engine")

# Get the specific, type-safe configuration object for this service.
# We cast the result to the specific config class for better type hinting and autocompletion.
settings = cast(AIBehavioralConfig, get_config())

# The 'settings' object can now be imported and used throughout the service,
# providing access to all configuration variables from the shared base and
# service-specific overrides.
