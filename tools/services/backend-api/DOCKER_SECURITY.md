# Docker Security Best Practices and Scanning Recommendations

## Overview

This document outlines the Docker security best practices implemented in the Beginner Investor Hub Backend API and provides recommendations for integrating Docker image security scanning into the CI/CD pipeline.

## Implemented Security Measures

### Multi-stage Builds

The Dockerfile uses a multi-stage build approach to minimize the final image size and reduce the attack surface:

1. **Builder Stage**: Installs all dependencies and builds the application
2. **Production Stage**: Copies only the built application and production dependencies

This approach ensures that build tools and development dependencies are not included in the final image.

### Non-root User

The production stage runs the application as a non-root user (`nextjs`) to limit the potential impact of container compromises:

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs
```

### Health Check

A health check is implemented to monitor the application's status:

```dockerfile
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node healthcheck.js
```

### Pinned Base Image Version

The Dockerfile uses a specific version of the Node.js base image (`node:18-alpine`) to ensure reproducibility and prevent unexpected changes.

### Minimal Base Image

The Dockerfile uses the Alpine variant of the Node.js image, which is smaller and has a reduced attack surface compared to full distributions.

## Docker Image Security Scanning Recommendations

To further enhance security, it's recommended to integrate Docker image security scanning into the CI/CD pipeline. Here are several options:

### 1. Trivy

Trivy is an open-source vulnerability scanner for containers and other artifacts.

**GitHub Actions Integration**:

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'your-image-name:tag'
    format: 'table'
    exit-code: '1'
    ignore-unfixed: true
    vuln-type: 'os,library'
    severity: 'CRITICAL,HIGH'
```

### 2. Clair

Clair is an open-source project for the static analysis of vulnerabilities in application containers.

**Integration Example**:

```bash
# Install clairctl
wget -O clairctl https://github.com/quay/clair/releases/download/v4.3.2/clairctl-linux-amd64
chmod +x clairctl

# Scan image
./clairctl report --host http://clair:6060 your-image-name:tag
```

### 3. Snyk

Snyk provides container security scanning with detailed vulnerability information and remediation advice.

**GitHub Actions Integration**:

```yaml
- name: Run Snyk to check Docker image for vulnerabilities
  uses: snyk/actions/docker@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    image: your-image-name:tag
    args: --severity-threshold=high
```

### 4. Docker Scout

Docker Scout is Docker's built-in security scanning tool.

**CLI Usage**:

```bash
docker scout cves your-image-name:tag
```

**GitHub Actions Integration**:

```yaml
- name: Docker Scout
  uses: docker/scout-action@v1
  with:
    command: cves
    image: your-image-name:tag
    sarif-file: sarif.output.json
    write-comment: true
```

## CI/CD Pipeline Integration

Here's an example of how to integrate security scanning into a GitHub Actions workflow:

```yaml
name: Build and Scan Docker Image

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        tags: your-image-name:latest
        load: true
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'your-image-name:latest'
        format: 'table'
        exit-code: '1'
        ignore-unfixed: true
        vuln-type: 'os,library'
        severity: 'CRITICAL,HIGH'
    
    - name: Run Snyk to check Docker image for vulnerabilities
      uses: snyk/actions/docker@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        image: your-image-name:latest
        args: --severity-threshold=high
```

## Best Practices for Docker Security

1. **Keep base images updated**: Regularly update base images to include security patches
2. **Scan images regularly**: Integrate security scanning into the CI/CD pipeline
3. **Use minimal base images**: Use Alpine or distroless images when possible
4. **Run as non-root**: Always run containers as a non-root user
5. **Implement multi-stage builds**: Reduce the attack surface by using multi-stage builds
6. **Sign images**: Use Docker Content Trust to sign images
7. **Limit capabilities**: Use the `--cap-drop` flag to drop unnecessary capabilities
8. **Use read-only filesystems**: Mount the root filesystem as read-only when possible
9. **Implement resource limits**: Use `--memory` and `--cpus` flags to limit resource consumption
10. **Regularly audit images**: Periodically audit images for vulnerabilities and compliance

## Conclusion

The Dockerfile for the Backend API implements several security best practices including multi-stage builds, non-root user execution, health checks, and pinned base image versions. To further enhance security, it's recommended to integrate Docker image security scanning into the CI/CD pipeline using tools like Trivy, Clair, Snyk, or Docker Scout.
