# Specification: Local Development Environment

## ADDED Requirements

### Requirement: Docker-based Development Setup
The system SHALL provide Docker configuration files for containerized local development of the application.

#### Scenario: First-time developer setup
- **GIVEN** a developer has cloned the repository
- **AND** has Docker and Docker Compose installed
- **WHEN** they run `docker-compose up`
- **THEN** the application SHALL start with both frontend (port 5173) and backend (port 3001) services
- **AND** the developer SHALL be able to access the application at http://localhost:5173

#### Scenario: Hot reload for code changes
- **GIVEN** the application is running in Docker development mode
- **WHEN** a developer modifies a source file (TypeScript, React component, Express route)
- **THEN** the changes SHALL be automatically detected and reflected without manual container restart
- **AND** the page SHALL reload automatically (for frontend changes via Vite HMR)

#### Scenario: Environment variables loading
- **GIVEN** a .env file exists in the project root with API keys
- **WHEN** the Docker container starts
- **THEN** all environment variables from .env SHALL be available to the application
- **AND** API calls SHALL work correctly using the configured keys

### Requirement: Dockerfile Configuration
The system SHALL provide a Dockerfile optimized for development workflow.

#### Scenario: Image build from Dockerfile
- **GIVEN** the Dockerfile exists in project root
- **WHEN** a developer runs `docker build -t precedent-app .`
- **THEN** the image SHALL be built successfully using Node.js 18 base
- **AND** the build SHALL complete in under 5 minutes on average hardware

#### Scenario: Development dependencies installation
- **GIVEN** the Dockerfile includes npm install step
- **WHEN** the image is built
- **THEN** all dependencies from package.json SHALL be installed
- **AND** both production and development dependencies SHALL be available

### Requirement: Docker Compose Orchestration
The system SHALL provide docker-compose.yml for simplified service management.

#### Scenario: Single command startup
- **GIVEN** docker-compose.yml exists in project root
- **WHEN** a developer runs `docker-compose up`
- **THEN** the container SHALL start with proper port mappings (3001:3001, 5173:5173)
- **AND** source code SHALL be mounted for hot reload
- **AND** node_modules SHALL be isolated in a named volume

#### Scenario: Container health monitoring
- **GIVEN** the Docker Compose configuration includes healthcheck
- **WHEN** the container is running
- **THEN** Docker SHALL periodically verify that the backend service responds
- **AND** the health status SHALL be visible via `docker-compose ps`

### Requirement: Docker Ignore Rules
The system SHALL provide .dockerignore to exclude unnecessary files from Docker context.

#### Scenario: Efficient build context
- **GIVEN** .dockerignore file exists with exclusion rules
- **WHEN** Docker builds the image
- **THEN** node_modules, dist, .git, .env SHALL NOT be copied to the build context
- **AND** the build context size SHALL be reduced by at least 80% compared to no ignore rules

### Requirement: Development Documentation
The system SHALL provide comprehensive documentation for Docker-based development.

#### Scenario: README Docker section
- **GIVEN** README.md is updated with Docker instructions
- **WHEN** a new developer reads the documentation
- **THEN** they SHALL find step-by-step instructions for:
  - Installing Docker prerequisites
  - Starting the application with docker-compose
  - Stopping and rebuilding containers
  - Configuring environment variables
  - Troubleshooting common issues
- **AND** the traditional npm-based workflow SHALL remain documented as an alternative

#### Scenario: Troubleshooting guide
- **GIVEN** the README includes troubleshooting section
- **WHEN** a developer encounters common Docker issues (port conflicts, volume permissions, build errors)
- **THEN** they SHALL find solutions in the documentation
- **AND** fallback options SHALL be documented (e.g., using npm directly)

### Requirement: Backward Compatibility
The Docker setup SHALL NOT break existing development workflows.

#### Scenario: npm workflow still works
- **GIVEN** the Docker files have been added to the project
- **WHEN** a developer chooses to use `npm run dev:all` directly (without Docker)
- **THEN** the application SHALL start and work exactly as before
- **AND** no Docker-specific dependencies SHALL be required in package.json

#### Scenario: Deployment process unchanged
- **GIVEN** the project uses SSH/scp for deployment
- **WHEN** Docker development setup is implemented
- **THEN** the deployment process SHALL remain unchanged
- **AND** no Docker configuration SHALL be required on production servers
