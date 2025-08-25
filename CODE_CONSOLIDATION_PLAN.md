### **Plan for Monorepo Consolidation and Legacy Code Migration**

**Objective:** To safely migrate valuable code and logic from legacy directories (`frontend/`, `backend/`, `ai_microservice/`, `python-engine/`) into the new microservices monorepo structure under `tools/`. This plan prioritizes a manual, review-intensive process to prevent data loss and ensure a smooth transition.

---

### **Phase 1: Analysis and Identification of Valuable Files**

This phase focuses on identifying critical code, configuration, and data in the legacy directories that must be preserved.

**1.1. Backend: `backend/` -> `tools/services/backend-api/`**

The legacy `backend/` directory contains the original Node.js API. While the new service exists, it's likely missing significant business logic.

*   **Key Files/Directories to Review in `backend/`:**
    *   `prisma/schema.prisma`: This is the authoritative database schema definition. It must be carefully compared with any data modeling in the new service.
    *   `database/schema/` & `database/seeds/`: Contains raw SQL for schema and data seeding. This logic may need to be adapted for the new service's deployment or migration process.
    *   `src/routes/`: Contains all legacy API endpoints (e.g., `challenges.ts`, `education.ts`, `gamification.ts`). This is the primary location of business logic that needs to be migrated.
    *   `src/services/`: Contains specialized business logic (e.g., `gamificationService.ts`) that must be moved.
    *   `src/config/`: Contains database and environment configuration that should be cross-referenced.
    *   `package.json`: The list of dependencies must be merged.

**1.2. AI Microservice: `ai_microservice/` -> `tools/services/ai_microservice/`**

This is a straightforward consolidation. The primary task is ensuring no logic from the original `main.py` is lost.

*   **Key Files to Review in `ai_microservice/`:**
    *   `src/main.py`: Contains the core application logic. This needs to be compared with the new, more structured service to ensure all features are present.
    *   `requirements.txt`: Dependencies must be merged.

**1.3. Python Services: `python-engine/` -> Multiple New Services**

The `python-engine/` directory appears to be a monolithic service whose functionality has been split.

*   **Hypothesis:** The `python-engine/main.py` file likely contains code for multiple distinct tasks: behavioral nudges, risk calculation, and market data ingestion. The consolidation will involve splitting this single file into the three new, specialized services.

*   **Checklist for `python-engine/` Analysis:**
    *   [ ] **Review `requirements.txt`:** Identify all dependencies (e.g., `pandas`, `numpy`, `scikit-learn`, `fastapi`, `requests`) to understand the full scope of the engine's capabilities.
    *   [ ] **Analyze `main.py`:** Read through the entire file and identify functions, classes, and logic blocks. Categorize them based on their purpose:
        *   **AI/Behavioral:** Look for terms like `nudge`, `bias`, `personalization`. This logic belongs in `tools/services/ai-behavioral-nudge-engine/`.
        *   **Risk/Simulation:** Look for terms like `risk`, `assess`, `simulate`, `portfolio`, `correlation`. This logic belongs in `tools/services/risk-calculation-engine/`.
        *   **Data Ingestion:** Look for terms like `fetch`, `ingest`, `marketdata`, `api-source`. This logic belongs in `tools/services/market-data-ingestion/`.
    *   [ ] **Review `env.py`:** Identify all environment variables and map them to the new service that will require them.

**1.4. Frontend: `frontend/` -> `tools/apps/web/`**

The legacy `frontend/` is a complete Next.js application. The new `tools/apps/web/` appears to be a new, mostly empty Next.js 13+ App Router project. The migration will involve moving the entire application structure.

*   **Key Directories to Migrate from `frontend/`:**
    *   `pages/`: **CRITICAL.** Contains all application pages and API routes. This logic will need to be migrated and likely refactored to work with the Next.js App Router structure in the new web app.
    *   `components/`: **CRITICAL.** All reusable React components.
    *   `store/`, `hooks/`, `lib/`, `styles/`, `types/`, `content/`: These contain the core application logic, state management, utilities, and styling.
    *   `package.json`: The list of dependencies is essential and must be merged.

---

### **Phase 2: Manual Code Migration and Consolidation**

This phase involves a developer manually moving the identified code. **Use Git for every step, with small, descriptive commits.**

*   **Migration Checklist:**

    *   [ ] **Backend (`backend/` -> `tools/services/backend-api/`)**
        *   [ ] Open `backend/prisma/schema.prisma` and `tools/services/backend-api/` side-by-side. Manually merge any missing models, fields, or relations into the new service's schema definition.
        *   [ ] For each file in `backend/src/routes/`, create a corresponding file in `tools/services/backend-api/src/routes/`. Copy the logic, update imports, and register the new routes in the main server file (`app.ts`).
        *   [ ] Copy any specialized services from `backend/src/services/` into `tools/services/backend-api/src/services/`.
        *   [ ] Merge all dependencies from `backend/package.json` into `tools/services/backend-api/package.json`. Run `pnpm install`.
        *   [ ] **Commit:** `feat(backend-api): migrate routes, services, and schema from legacy backend`

    *   [ ] **Python Engine (`python-engine/` -> new services)**
        *   [ ] Following the analysis from Phase 1, systematically copy functions and classes from `python-engine/main.py` into the appropriate files within the three new Python services.
        *   [ ] Add the necessary dependencies from `python-engine/requirements.txt` to the `requirements.txt` file of each new service that requires them.
        *   [ ] **Commit:** `feat(py-services): partition and migrate logic from monolithic python-engine`

    *   [ ] **Frontend (`frontend/` -> `tools/apps/web/`)**
        *   [ ] Merge all dependencies from `frontend/package.json` into `tools/apps/web/package.json`. Run `pnpm install`.
        *   [ ] Copy the contents of `frontend/components/`, `hooks/`, `lib/`, `store/`, `styles/`, `types/`, and `content/` into their corresponding directories in `tools/apps/web/src/`.
        *   [ ] **(This is the largest step)** Manually migrate each page from `frontend/pages/` to the `tools/apps/web/src/app/` directory, refactoring from the Pages Router to the App Router paradigm as needed.
        *   [ ] **Commit:** `feat(web): migrate all components, hooks, state, and pages from legacy frontend`

---

### **Phase 3: Safe Cleanup and Deprecation**

Only proceed with this phase after the new services have been thoroughly tested and confirmed to be fully functional.

**3.1. Temporary Deprecation (Non-Destructive)**

This step removes the legacy code from the build path without permanently deleting it, providing a rollback path.

*   **Action:** Use `git mv` to rename the legacy directories. This preserves their Git history.
    ```bash
    git mv backend _deprecated_backend
    git mv frontend _deprecated_frontend
    git mv ai_microservice _deprecated_ai_microservice
    git mv python-engine _deprecated_python-engine
    ```
*   **Commit:** `chore: deprecate legacy service directories`
*   **Verification:** Run all project tests and build scripts again to ensure the system operates correctly without the old directories.

**3.2. Permanent Deletion**

Once you are confident that the deprecated directories are no longer needed and all functionality is stable, you can permanently remove them.

*   **Action:** Use `git rm` to delete the directories from the repository.
    ```bash
    git rm -r _deprecated_backend
    git rm -r _deprecated_frontend
    git rm -r _deprecated_ai_microservice
    git rm -r _deprecated_python-engine
    ```
*   **Commit:** `chore: remove deprecated service directories`

---

**Final Note:** This is a significant architectural change. The key to success is a meticulous, manual review of every file being migrated. Do not rely on automated tools. Prioritize careful, incremental changes with constant testing and verification.
