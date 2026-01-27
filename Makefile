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

SOURCE_GIT_COMMIT ?=$(shell git rev-parse "HEAD^{commit}" 2>/dev/null)
SOURCE_GIT_COMMIT_SHORT ?=$(shell git rev-parse --short "HEAD^{commit}" 2>/dev/null)
SOURCE_GIT_TAG ?=$(shell git describe --always --tags --abbrev=7 --match '[0-9]*\.[0-9]*\.[0-9]*' --match 'v[0-9]*\.[0-9]*\.[0-9]*' || echo 'v0.0.0-unknown-$(SOURCE_GIT_COMMIT_SHORT)')
IMAGE_TAG ?= $(SOURCE_GIT_COMMIT_SHORT)

# OS detection for host networking
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
    API_HOST := host-gateway
else
    # Get the IP of the default route interface on macOS
    API_HOST := $(shell route -n get default 2>/dev/null | awk '/interface:/{iface=$$2} END{if(iface) system("ipconfig getifaddr " iface)}')
endif

.PHONY: oc
oc: # Verify oc installed, in linux install it if not already installed
ifeq ($(OC_BIN),)
	@if [ "$(OS)" = "darwin" ]; then \
		echo "Error: macOS detected. Please install oc manually from https://mirror.openshift.com/pub/openshift-v4/clients/ocp/$(OC_VERSION)/"; \
		exit 1; \
	fi
	@echo "oc not found. Installing for Linux..."
	@curl -sL "https://mirror.openshift.com/pub/openshift-v4/clients/ocp/$(OC_VERSION)/openshift-client-linux.tar.gz" | tar -xz
	@chmod +x oc kubectl
	@sudo mv oc kubectl /usr/local/bin/
	@echo "oc installed successfully."
else
	@echo "oc is already installed at $(OC_BIN)"
endif

# Downloads and sets up all the packages, based on your package.json
.PHONY: install
install:
	@echo "📦 Update all packages..."
	npm install --legacy-peer-deps
	@echo "✅ All packages are updated successfully..."

# Build the standalone application locally
.PHONY: build-standalone
build-standalone: install
	@echo "Building standalone application..."
	rm -rf dev/dist
	MIGRATION_PLANNER_UI_GIT_COMMIT=$(SOURCE_GIT_COMMIT) \
	 MIGRATION_PLANNER_UI_VERSION=$(SOURCE_GIT_TAG) \
	 npm run build:standalone
	@echo "✅ Standalone build completed in dev/dist/"

# Run the standalone application locally
.PHONY: run-standalone
run-standalone: install
	@echo "Running standalone application..."
	rm -rf dev/dist
	MIGRATION_PLANNER_UI_GIT_COMMIT=$(SOURCE_GIT_COMMIT) \
	 MIGRATION_PLANNER_UI_VERSION=$(SOURCE_GIT_TAG) \
	 PLANNER_LOCAL_DEV=true \
	 npm run start:standalone
	@echo "✅ Standalone run completed"

# Legacy build target (federated module)
.PHONY: build
build: install
	@echo "Building federated module..."
	rm -rf dist
	MIGRATION_PLANNER_UI_GIT_COMMIT=$(SOURCE_GIT_COMMIT) \
	 MIGRATION_PLANNER_UI_VERSION=$(SOURCE_GIT_TAG) \
	 npm run build
	@echo "✅ Federated build completed in dist/"

# Run ESLint checks
.PHONY: lint-check
lint-check: install
	@echo "🔍 Running lint checks..."
	@npm run lint
	@echo "✅ Lint checks passed!"

# Run ESLint with auto-fix
.PHONY: lint-fix
lint-fix: install
	@echo "🧹 Running lint fix..."
	@npm run lint -- --fix
	@echo "✅ Lint fix completed!"

# Run Prettier format checks
.PHONY: format-check
format-check: install
	@echo "🎨 Running format checks..."
	@npm run format -- --check
	@echo "✅ Format checks passed!"

# Run Prettier format fix
.PHONY: format-fix
format-fix: install
	@echo "🎨 Formatting code..."
	@npm run format -- --write
	@echo "✅ Format completed!"

# TypeScript type checking
.PHONY: type-check
type-check: install
	@echo "🔍 Running TypeScript type checking..."
	@npx tsc --noEmit
	@echo "✅ TypeScript type checking passed!"

# Tests
.PHONY: test
test: install
	@echo "🔍 Running tests..."
	@npm test
	@echo "✅ Tests passed!"

# Security vulnerability scanning
.PHONY: security-scan
security-scan: install
	@echo "🔒 Running security vulnerability scan..."
	@npm audit --audit-level=moderate
	@echo "✅ Security vulnerability scan completed!"

# Fix security vulnerabilities
.PHONY: security-fix
security-fix: install
	@echo "🔧 Fixing security vulnerabilities..."
	@npm audit fix
	@echo "✅ Security vulnerabilities fixed!"

# Fix security vulnerabilities with breaking changes
.PHONY: security-fix-force
security-fix-force: install
	@echo "🔧 Fixing security vulnerabilities (including breaking changes)..."
	@npm audit fix --force
	@echo "✅ All security vulnerabilities fixed!"

# Combined format validation - runs both linting and format checks
.PHONY: validate-all
validate-all: lint-check format-check type-check test security-scan
	@echo "✅ All validation checks passed!"

# Build the container image
.PHONY: podman-build
podman-build:
	@echo "Building container image: $(IMAGE):$(IMAGE_TAG)"
	@if [ ! -f "$(CONTAINERFILE_PATH)" ]; then \
		echo "Error: Containerfile not found at $(CONTAINERFILE_PATH)"; \
		exit 1; \
	fi
	$(PODMAN) build . \
		-t $(IMAGE):$(IMAGE_TAG) \
		-f $(CONTAINERFILE_PATH) \
		--ignorefile $(CONTAINERIGNORE_PATH) \
		--arch amd64 \
		--memory=4g \
		--layers \
		--build-arg USE_MIGRATION_PLANNER_API=true
	@echo "Container image built successfully: $(IMAGE):$(IMAGE_TAG)"

# Tag the image as latest
.PHONY: podman-tag-latest
podman-tag-latest:
	$(PODMAN) tag $(IMAGE):$(IMAGE_TAG) $(IMAGE):latest
	@echo "Tagged $(IMAGE):$(IMAGE_TAG) as $(IMAGE):latest"

# Run the container
.PHONY: podman-run
podman-run:
	@echo "Starting container: $(CONTAINER_NAME)"
	@# Stop and remove existing container if it exists
	-$(PODMAN) stop $(CONTAINER_NAME) 2>/dev/null || true
	-$(PODMAN) rm $(CONTAINER_NAME) 2>/dev/null || true
	@# Check if image exists
	@if ! $(PODMAN) image exists $(IMAGE):$(IMAGE_TAG); then \
		echo "Error: Image $(IMAGE):$(IMAGE_TAG) not found. Run 'make podman-build' first."; \
		exit 1; \
	fi
	@# Check if port is available
	@if netstat -tlnp 2>/dev/null | grep -q ":$(HOST_PORT) "; then \
		echo "Warning: Port $(HOST_PORT) appears to be in use."; \
	fi
	$(PODMAN) run -d \
		--name $(CONTAINER_NAME) \
		-p $(HOST_PORT):$(CONTAINER_PORT) \
		--add-host=migration-planner-api:$(API_HOST) \
		$(IMAGE):$(IMAGE_TAG)
	@echo "Container started successfully!"
	@echo "Access the application at: http://localhost:$(HOST_PORT)/openshift/migration-assessment"
	@echo "Container name: $(CONTAINER_NAME)"

# Stop the container
.PHONY: podman-stop
podman-stop:
	@echo "Stopping container: $(CONTAINER_NAME)"
	-$(PODMAN) stop $(CONTAINER_NAME) 2>/dev/null || true
	-$(PODMAN) rm $(CONTAINER_NAME) 2>/dev/null || true
	@echo "Container stopped and removed."

# Show container logs
.PHONY: podman-logs
podman-logs:
	$(PODMAN) logs -f $(CONTAINER_NAME)

# Show container status
.PHONY: podman-status
podman-status:
	@echo "Container status:"
	$(PODMAN) ps -a --filter "name=$(CONTAINER_NAME)"

# Remove the container image
.PHONY: podman-clean
podman-clean:
	@echo "Removing container image: $(IMAGE):$(IMAGE_TAG)"
	-$(PODMAN) rmi $(IMAGE):$(IMAGE_TAG) 2>/dev/null || true
	-$(PODMAN) rmi $(IMAGE):latest 2>/dev/null || true
	@echo "Container image removed."

# Complete container workflow: build and run
.PHONY: podman-deploy
podman-deploy: podman-build podman-run

# Container development workflow: build, tag as latest, and run
.PHONY: podman-dev
podman-dev: podman-build podman-tag-latest podman-run

.PHONY: quay-login
quay-login:
	@if [ ! -f $(DOCKER_AUTH_FILE) ] && [ $(QUAY_USER) ] && [ $(QUAY_TOKEN) ]; then \
		$(info Create Auth File: $(DOCKER_AUTH_FILE)) \
		mkdir -p "$(DOCKER_CONF)"; \
		$(PODMAN) login --authfile $(DOCKER_AUTH_FILE) -u=$(QUAY_USER) -p=$(QUAY_TOKEN) quay.io; \
	fi;

.PHONY: podman-push
podman-push:
	@echo "Pushing container image: $(IMAGE):$(IMAGE_TAG)"
	if [ -f $(DOCKER_AUTH_FILE) ]; then \
		$(PODMAN) push --authfile=$(DOCKER_AUTH_FILE) $(IMAGE):$(IMAGE_TAG); \
	else \
		$(PODMAN) push $(IMAGE):$(IMAGE_TAG); \
	fi;
	@echo "Container image pushed successfully."

# OpenShift deployment
.PHONY: deploy-on-openshift
deploy-on-openshift:
	@echo "Deploying Migration Planner UI to OpenShift..."
	oc process -f deploy/dev/ui-template.yaml \
		   -p MIGRATION_PLANNER_UI_IMAGE=$(IMAGE) \
		   -p MIGRATION_PLANNER_REPLICAS=$(REPLICAS) \
		   -p IMAGE_TAG=$(IMAGE_TAG) \
		 | oc apply -f -
	@echo "*** Migration Planner UI has been deployed successfully on OpenShift ***"
	@echo "Getting route information..."
	@oc get route planner-ui -o jsonpath='{.spec.host}' 2>/dev/null && echo "" || echo "Route not yet available"

.PHONY: delete-from-openshift
delete-from-openshift:
	@echo "Deleting Migration Planner UI from OpenShift..."
	oc process -f deploy/dev/ui-template.yaml \
		   -p MIGRATION_PLANNER_UI_IMAGE=$(IMAGE) \
		   -p MIGRATION_PLANNER_REPLICAS=$(REPLICAS) \
		   -p IMAGE_TAG=$(IMAGE_TAG) \
		 | oc delete -f -
	@echo "*** Migration Planner UI has been deleted successfully from OpenShift ***"

# Help target
.PHONY: help
help:
	@echo "Migration Planner UI - Available Make targets:"
	@echo ""
	@echo "Local Development:"
	@echo "  build-standalone     Build the standalone application locally"
	@echo "  build               Build the federated module locally"
	@echo "  lint-check          Run ESLint checks"
	@echo "  lint-fix            Run ESLint with auto-fix"
	@echo "  format-check        Check code formatting with Prettier"
	@echo "  format-fix          Format code with Prettier"
	@echo "  type-check          TypeScript type checking"
	@echo "  test                Run tests"
	@echo "  security-scan       Run security vulnerability scan"
	@echo "  security-fix        Fix security vulnerabilities"
	@echo "  security-fix-force  Fix security vulnerabilities (including breaking changes)"
	@echo "  validate-all        Run all validation checks (lint-check + format-check + type-check + security-scan + test)"
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
	@echo "  quay-login          Login to Quay.io registry"
	@echo "  podman-push         Push container image to registry"
	@echo ""
	@echo "OpenShift Deployment:"
	@echo "  deploy-on-openshift Deploy application on OpenShift"
	@echo "  delete-from-openshift Remove application from OpenShift"
	@echo ""
	@echo "Configuration Variables:"
	@echo "  IMAGE=$(IMAGE)"
	@echo "  IMAGE_TAG=$(IMAGE_TAG)"
	@echo "  CONTAINER_NAME=$(CONTAINER_NAME)"
	@echo "  HOST_PORT=$(HOST_PORT)"
	@echo "  CONTAINER_PORT=$(CONTAINER_PORT)"

# Default target
.DEFAULT_GOAL := help

