# Container and deployment configuration
DOCKER_CONF ?= $(CURDIR)/docker-config
DOCKER_AUTH_FILE ?= ${DOCKER_CONF}/auth.json
PODMAN ?= podman
REPLICAS ?= 1

# Container runtime configuration
CONTAINER_NAME ?= migration-planner-ui
CONTAINER_PORT ?= 8081
HOST_PORT ?= 8081
CONTAINERFILE_PATH ?= deploy/dev/Containerfile
CONTAINERIGNORE_PATH ?= deploy/dev/.containerignore

# Architecture configuration (auto-detect, supports amd64/arm64)
ARCH ?= $(shell uname -m | sed 's/x86_64/amd64/' | sed 's/aarch64/arm64/' | sed 's/arm64/arm64/')

# Git and version information
SOURCE_GIT_COMMIT ?=$(shell git rev-parse "HEAD^{commit}" 2>/dev/null)
SOURCE_GIT_COMMIT_SHORT ?=$(shell git rev-parse --short "HEAD^{commit}" 2>/dev/null)
SOURCE_GIT_TAG ?=$(shell git describe --tags --abbrev=7 2>/dev/null | sed 's/-[0-9]*-g/-/' || echo 'v0.0.0-$$(git rev-parse --short "HEAD^{commit}" 2>/dev/null)')
IMAGE_TAG ?= $(SOURCE_GIT_TAG)
IMAGE ?= localhost/migration-assessment-ui

# OpenShift CLI configuration
OC_BIN ?= $(shell command -v oc 2>/dev/null)
OC_VERSION ?= stable

MIGRATION_PLANNER_API_BASE_URL ?= /api/migration-assessment
MIGRATION_PLANNER_UI_GIT_COMMIT ?= $(SOURCE_GIT_COMMIT)
MIGRATION_PLANNER_UI_VERSION ?= $(SOURCE_GIT_TAG)

BUILD_VAR_NAMES := MIGRATION_PLANNER_API_BASE_URL MIGRATION_PLANNER_UI_GIT_COMMIT MIGRATION_PLANNER_UI_VERSION
# Build environment variables (for shell commands)
BUILD_ENV := $(foreach var,$(BUILD_VAR_NAMES),$(var)=$($(var)))
# Build arguments (for container builds)
BUILD_ARGS := $(foreach var,$(BUILD_VAR_NAMES),--build-arg $(var)=$($(var)))

# Linting and formatting command bases
ESLINT_CMD := npx eslint --cache --cache-location node_modules/.cache/eslintcache --cache-strategy content .
PRETTIER_CMD := npx prettier --cache --cache-location node_modules/.cache/prettiercache --cache-strategy content .

.PHONY: help oc install ci-install clean build-standalone run-standalone preview-standalone patch-hosts start start-dev-proxy start-federated build lint format type-check test coverage security-scan security-fix security-fix-force validate-all podman-build podman-run podman-stop podman-logs podman-status podman-clean podman-tag-latest podman-deploy podman-dev quay-login podman-push deploy-on-openshift delete-from-openshift version test-watch

# Default target
.DEFAULT_GOAL := help

# Help target
help:
	@echo "Migration Planner UI - Available Make targets:"
	@echo ""
	@echo "Local Development:"
	@echo "  install             Install/update all packages"
	@echo "  ci-install          Immutable installation using npm ci (for CI)"
	@echo "  clean               Clean build artifacts and dependencies"
	@echo "  build-standalone    Build the standalone application locally"
	@echo "  build               Build the federated module locally"
	@echo "  run-standalone      Run the standalone application locally"
	@echo "  preview-standalone  Preview standalone build"
	@echo "  start               Start federated dev server (HOT mode)"
	@echo "  start-dev-proxy     Start dev proxy server"
	@echo "  start-federated     Start federated static server"
	@echo "  patch-hosts         Patch /etc/hosts for local development"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint                Run ESLint checks (use FIX=1 to auto-fix)"
	@echo "  format              Check code formatting with Prettier (use FIX=1 to format)"
	@echo "  type-check          TypeScript type checking"
	@echo "  test                Run tests"
	@echo "  test-watch          Run tests in watch mode"
	@echo "  coverage            Run tests with coverage report"
	@echo "  security-scan       Run security vulnerability scan"
	@echo "  security-fix        Fix security vulnerabilities"
	@echo "  security-fix-force  Fix security vulnerabilities (including breaking changes)"
	@echo "  validate-all        Run all validation checks (lint + format + type-check + test + security-scan)"
	@echo ""
	@echo "Container Management:"
	@echo "  podman-build        Build the container image"
	@echo "  podman-run          Run the container"
	@echo "  podman-stop         Stop and remove the container"
	@echo "  podman-logs         Show container logs"
	@echo "  podman-status       Show container status"
	@echo "  podman-clean        Remove container images"
	@echo "  podman-deploy       Build and run container (build + run)"
	@echo "  podman-dev          Development workflow (build + tag latest + run)"
	@echo ""
	@echo "Container Registry:"
	@echo "  quay-login          Login to Quay.io registry (requires QUAY_USER and QUAY_TOKEN)"
	@echo "  podman-push         Push container image to registry"
	@echo ""
	@echo "OpenShift Deployment:"
	@echo "  oc                  Install oc CLI (Linux only, macOS requires manual install)"
	@echo "  deploy-on-openshift Deploy application on OpenShift"
	@echo "  delete-from-openshift Remove application from OpenShift"
	@echo ""
	@echo "Utilities:"
	@echo "  version             Display version information"
	@echo ""
	@echo "Configuration Variables:"
	@echo "  IMAGE=$(IMAGE)"
	@echo "  IMAGE_TAG=$(IMAGE_TAG)"
	@echo "  ARCH=$(ARCH)"
	@echo "  CONTAINER_NAME=$(CONTAINER_NAME)"
	@echo "  HOST_PORT=$(HOST_PORT)"
	@echo "  CONTAINER_PORT=$(CONTAINER_PORT)"

# Verify oc installed, in linux install it if not already installed
oc:
ifeq ($(OC_BIN),)
	@if [ "$$(uname -s)" = "Darwin" ]; then \
		echo "❌ Error: macOS detected. Please install oc manually from https://mirror.openshift.com/pub/openshift-v4/clients/ocp/$(OC_VERSION)/"; \
		exit 1; \
	fi
	@echo "🔧 oc not found. Installing for Linux..."
	@curl -sL "https://mirror.openshift.com/pub/openshift-v4/clients/ocp/$(OC_VERSION)/openshift-client-linux.tar.gz" | tar -xz
	@chmod +x oc kubectl
	@mkdir -p ~/.local/bin && mv oc kubectl ~/.local/bin/
	@echo "✅ oc installed successfully."
else
	@echo "✅ oc is already installed at $(OC_BIN)"
endif

# Downloads and sets up all the packages, based on your package.json
install:
	@echo "📦 Update all packages..."
	npm install
	@echo "✅ All packages are updated successfully..."

# Immutable installation using npm ci (for CI environments)
ci-install:
	@echo "📦 Installing packages (immutable)..."
	npm ci --legacy-peer-deps
	@echo "✅ Packages installed successfully!"

# Clean build artifacts and dependencies
clean:
	@echo "🧹 Cleaning build artifacts and dependencies..."
	@npx rimraf node_modules dist dev/dist .cache
	@echo "✅ Clean completed!"

# Build the standalone application locally
build-standalone: install
	@echo "🔨 Building standalone application..."
	@rm -rf dev/dist
	@$(BUILD_ENV) npx vite build ./dev -c ./dev/vite.config.ts
	@echo "✅ Standalone build completed in dev/dist/"

# Run the standalone application locally
run-standalone: install
	@echo "🚀 Running standalone application..."
	@rm -rf dev/dist
	@$(BUILD_ENV) npx vite ./dev \
		-c ./dev/vite.config.ts \
		--mode dev \
		--host 0.0.0.0
	@echo "✅ Standalone run completed"

# Preview standalone build
preview-standalone: build-standalone
	@echo "👀 Previewing standalone build..."
	@npx vite preview ./dev \
		-c ./dev/vite.config.ts \
		--mode dev \
		--open http://localhost:3000/ \
		--host 0.0.0.0 \
		--port 3000
	@echo "✅ Standalone preview started!"

# Patch /etc/hosts for local development
patch-hosts: install
	@echo "🔧 Patching /etc/hosts for local development..."
	@npx fec patch-etc-hosts
	@echo "✅ Hosts file patched!"

# Start federated dev server (HOT mode)
start: install
	@echo "🚀 Starting federated dev server..."
	@HOT=true npx fec dev --clouddotEnv=stage --uiEnv=stable
	@echo "✅ Federated dev server started!"

# Start dev proxy server
start-dev-proxy: install
	@echo "🚀 Starting dev proxy server..."
	@npx fec dev-proxy --clouddotEnv=stage --uiEnv=stable
	@echo "✅ Dev proxy server started!"

# Start federated static server
start-federated: install
	@echo "🚀 Starting federated static server..."
	@npx fec static
	@echo "✅ Federated static server started!"

# Legacy build target (federated module)
build: install
	@echo "🔨 Building federated module..."
	@rm -rf dist
	@$(BUILD_ENV) npx fec build
	@echo "✅ Federated build completed in dist/"

# Run ESLint (use FIX=1 to auto-fix issues)
lint: install
ifdef FIX
	@echo "🧹 Fixing lint issues..."
	@$(ESLINT_CMD) --fix
	@echo "✅ Lint issues fixed!"
else
	@echo "🔍 Checking lint issues..."
	@$(ESLINT_CMD)
	@echo "✅ Lint issues checked!"
endif

# Run Prettier format (use FIX=1 to format code)
format: install
ifdef FIX
	@echo "🔧 Fixing code formatting..."
	@$(PRETTIER_CMD) --write
	@echo "✅ Code formatting fixed!"
else
	@echo "🎨 Checking code formatting..."
	@$(PRETTIER_CMD) --check
	@echo "✅ Code formatting checked!"
endif

# TypeScript type checking
type-check: install
	@echo "🔍 Checking TypeScript type issues..."
	@npx tsc --noEmit
	@echo "✅ TypeScript type issues checked!"

# Tests
test: install
	@echo "🔍 Running tests..."
	@npx vitest run
	@echo "✅ Tests passed!"

# Test coverage
coverage: install
	@echo "📊 Running tests with coverage..."
	@npx vitest run --coverage
	@echo "✅ Coverage report generated!"

# Security vulnerability scanning
security-scan: install
	@echo "🔒 Running security vulnerability scan..."
	@npm audit --audit-level=moderate
	@echo "✅ Security vulnerability scan completed!"

# Fix security vulnerabilities
security-fix: install
	@echo "🔧 Fixing security vulnerabilities..."
	@npm audit fix
	@echo "✅ Security vulnerabilities fixed!"

# Fix security vulnerabilities with breaking changes
security-fix-force: install
	@echo "🔧 Fixing security vulnerabilities (including breaking changes)..."
	@npm audit fix --force
	@echo "✅ All security vulnerabilities fixed!"

# Combined format validation - runs both linting and format checks
validate-all: lint format type-check test security-scan
	@echo "✅ All validation checks passed!"

# Build the container image
podman-build:
	@echo "🔨 Building container image: $(IMAGE):$(IMAGE_TAG) (arch: $(ARCH))"
	@if [ ! -f "$(CONTAINERFILE_PATH)" ]; then \
		echo "❌ Error: Containerfile not found at $(CONTAINERFILE_PATH)"; \
		exit 1; \
	fi
	@$(PODMAN) build . \
		-t $(IMAGE):$(IMAGE_TAG) \
		-f $(CONTAINERFILE_PATH) \
		--ignorefile $(CONTAINERIGNORE_PATH) \
		--arch $(ARCH) \
		--memory=4g \
		--layers \
		$(BUILD_ARGS)
	@echo "✅ Container image built successfully: $(IMAGE):$(IMAGE_TAG)"

# Run the container
podman-run: podman-build
	@echo "🚀 Starting container: $(CONTAINER_NAME)"
	@# Stop and remove existing container if it exists
	@-$(PODMAN) stop $(CONTAINER_NAME) 2>/dev/null || true
	@-$(PODMAN) rm $(CONTAINER_NAME) 2>/dev/null || true
	@# Check if port is available (using lsof for cross-platform compatibility)
	@if lsof -i :$(HOST_PORT) >/dev/null 2>&1; then \
		echo "⚠️  Warning: Port $(HOST_PORT) appears to be in use."; \
	fi
	@# OS detection for host networking
	@if [ "$$(uname -s)" = "Darwin" ]; then \
		API_HOST=$$(route -n get default 2>/dev/null | awk '/interface:/{iface=$$2} END{if(iface) system("ipconfig getifaddr " iface)}'); \
		$(PODMAN) run -d \
			--name $(CONTAINER_NAME) \
			-p $(HOST_PORT):$(CONTAINER_PORT) \
			--add-host=migration-planner-api:$${API_HOST} \
			$(IMAGE):$(IMAGE_TAG); \
	else \
		$(PODMAN) run -d \
			--name $(CONTAINER_NAME) \
			-p $(HOST_PORT):$(CONTAINER_PORT) \
			--add-host=migration-planner-api:host-gateway \
			$(IMAGE):$(IMAGE_TAG); \
	fi
	@echo "✅ Container started successfully!"
	@echo "🌐 Access the application at: http://localhost:$(HOST_PORT)/"
	@echo "📦 Container name: $(CONTAINER_NAME)"

# Stop the container
podman-stop:
	@echo "🛑 Stopping container: $(CONTAINER_NAME)"
	@-$(PODMAN) stop $(CONTAINER_NAME) 2>/dev/null || true
	@-$(PODMAN) rm $(CONTAINER_NAME) 2>/dev/null || true
	@echo "✅ Container stopped and removed."

# Show container logs
podman-logs:
	@echo "📋 Showing logs for container: $(CONTAINER_NAME)"
	@$(PODMAN) logs -f $(CONTAINER_NAME)

# Show container status
podman-status:
	@echo "📊 Container status:"
	@$(PODMAN) ps -a --filter "name=$(CONTAINER_NAME)"

# Remove the container image
podman-clean:
	@echo "🧹 Removing container image: $(IMAGE):$(IMAGE_TAG)"
	@-$(PODMAN) rmi $(IMAGE):$(IMAGE_TAG) 2>/dev/null || true
	@-$(PODMAN) rmi $(IMAGE):latest 2>/dev/null || true
	@echo "✅ Container image removed."

# Tag the image as latest
podman-tag-latest:
	@$(PODMAN) tag $(IMAGE):$(IMAGE_TAG) $(IMAGE):latest
	@echo "🏷️  Tagged $(IMAGE):$(IMAGE_TAG) as $(IMAGE):latest"

# Complete container workflow: build and run
podman-deploy: podman-build podman-run

# Container development workflow: build, tag as latest, and run
podman-dev: podman-build podman-tag-latest podman-run

quay-login:
	@if [ -f "$(DOCKER_AUTH_FILE)" ]; then \
		echo "✅ Auth file already exists: $(DOCKER_AUTH_FILE)"; \
	elif [ -z "$(QUAY_USER)" ] || [ -z "$(QUAY_TOKEN)" ]; then \
		echo "❌ Error: QUAY_USER and QUAY_TOKEN environment variables must be set"; \
		exit 1; \
	else \
		echo "🔐 Creating auth file: $(DOCKER_AUTH_FILE)"; \
		mkdir -p "$(DOCKER_CONF)"; \
		echo "$(QUAY_TOKEN)" | $(PODMAN) login --authfile $(DOCKER_AUTH_FILE) -u=$(QUAY_USER) --password-stdin quay.io; \
		echo "✅ Logged in to quay.io successfully"; \
	fi

podman-push: quay-login
	@echo "📤 Pushing container image: $(IMAGE):$(IMAGE_TAG)"
	@# Verify image exists before pushing
	@if ! $(PODMAN) image exists $(IMAGE):$(IMAGE_TAG) 2>/dev/null; then \
		echo "❌ Error: Image $(IMAGE):$(IMAGE_TAG) not found. Run 'make podman-build' first."; \
		exit 1; \
	fi
	@if [ -f "$(DOCKER_AUTH_FILE)" ]; then \
		$(PODMAN) push --authfile=$(DOCKER_AUTH_FILE) $(IMAGE):$(IMAGE_TAG); \
	else \
		$(PODMAN) push $(IMAGE):$(IMAGE_TAG); \
	fi
	@echo "✅ Container image pushed successfully."

# OpenShift deployment
deploy-on-openshift: oc
	@echo "🚀 Deploying Migration Planner UI to OpenShift..."
	@oc process -f deploy/dev/ui-template.yaml \
		   -p MIGRATION_PLANNER_UI_IMAGE=$(IMAGE) \
		   -p MIGRATION_PLANNER_REPLICAS=$(REPLICAS) \
		   -p IMAGE_TAG=$(IMAGE_TAG) \
		 | oc apply -f -
	@echo "✅ Migration Planner UI has been deployed successfully on OpenShift"
	@echo "🔍 Getting route information..."
	@oc get route planner-ui -o jsonpath='{.spec.host}' 2>/dev/null && echo "" || echo "⏳ Route not yet available"

delete-from-openshift: oc
	@echo "🗑️  Deleting Migration Planner UI from OpenShift..."
	@oc process -f deploy/dev/ui-template.yaml \
		   -p MIGRATION_PLANNER_UI_IMAGE=$(IMAGE) \
		   -p MIGRATION_PLANNER_REPLICAS=$(REPLICAS) \
		   -p IMAGE_TAG=$(IMAGE_TAG) \
		 | oc delete -f -
	@echo "✅ Migration Planner UI has been deleted successfully from OpenShift"

# Display version information
version:
	@echo "📋 Version Information:"
	@echo "  Git Commit: $(SOURCE_GIT_COMMIT)"
	@echo "  Git Commit (short): $(SOURCE_GIT_COMMIT_SHORT)"
	@echo "  Git Tag: $(SOURCE_GIT_TAG)"
	@echo "  Image Tag: $(IMAGE_TAG)"

# Run tests in watch mode
test-watch: install
	@echo "👀 Running tests in watch mode..."
	@npx vitest watch
