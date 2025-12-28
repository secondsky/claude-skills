# GitLab CI for Cloudflare Workers

Complete guide for GitLab CI/CD pipelines for Workers.

## Basic Pipeline Structure

**.gitlab-ci.yml**:
```yaml
image: oven/bun:latest

stages:
  - test
  - deploy

variables:
  FF_USE_FASTZIP: "true" # Faster caching

cache:
  paths:
    - node_modules/
    - .bun/

test:
  stage: test
  script:
    - bun install
    - bun test --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

deploy:
  stage: deploy
  script:
    - bun install
    - bunx wrangler deploy
  only:
    - main
  environment:
    name: production
    url: https://my-worker.workers.dev
```

## Multi-Environment Deployments

```yaml
deploy-staging:
  stage: deploy
  script:
    - bunx wrangler deploy --env staging
  only:
    - develop
  environment:
    name: staging
    url: https://my-worker-staging.workers.dev

deploy-production:
  stage: deploy
  script:
    - bunx wrangler deploy --env production
  only:
    - main
  environment:
    name: production
    url: https://my-worker.workers.dev
  when: manual # Requires manual trigger
```

## Review Apps (Preview Deployments)

```yaml
review:
  stage: deploy
  script:
    - bunx wrangler deploy --env review-$CI_MERGE_REQUEST_IID
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://my-worker-review-$CI_MERGE_REQUEST_IID.workers.dev
    on_stop: stop_review
  only:
    - merge_requests

stop_review:
  stage: deploy
  script:
    - bunx wrangler delete --name my-worker-review-$CI_MERGE_REQUEST_IID
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  when: manual
  only:
    - merge_requests
```

## Secrets Management

### Setting Variables

**Project Settings → CI/CD → Variables → Add variable**:
- `CLOUDFLARE_API_TOKEN` (masked, protected)
- `DATABASE_URL` (masked, protected)
- `STRIPE_SECRET_KEY` (masked, protected)

### Using Variables

```yaml
deploy:
  script:
    - echo "$DATABASE_URL" | bunx wrangler secret put DATABASE_URL --env production
    - echo "$STRIPE_SECRET_KEY" | bunx wrangler secret put STRIPE_SECRET_KEY --env production
    - bunx wrangler deploy --env production
  environment:
    name: production
```

### Environment-Specific Variables

Create variables scoped to environments:

```yaml
deploy-production:
  variables:
    ENVIRONMENT: "production"
  script:
    - echo "$DATABASE_URL_PRODUCTION" | bunx wrangler secret put DATABASE_URL
  environment:
    name: production
```

## Advanced Patterns

### Conditional Deployment

```yaml
deploy:
  script:
    - bunx wrangler deploy
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: always
    - if: '$CI_COMMIT_TAG'
      when: never
    - changes:
        - src/**/*
        - wrangler.jsonc
```

### Parallel Jobs

```yaml
test:
  parallel:
    matrix:
      - BUN_VERSION: ['latest', '1.1.0']
  image: oven/bun:${BUN_VERSION}
  script:
    - bun install
    - bun test
```

### Deploy to Multiple Workers

```yaml
deploy-api:
  script:
    - cd workers/api
    - bunx wrangler deploy

deploy-frontend:
  script:
    - cd workers/frontend
    - bunx wrangler deploy
```

## Caching

```yaml
cache:
  key:
    files:
      - bun.lockb
  paths:
    - node_modules/
    - .bun/
```

## Resources

- GitLab CI Docs: https://docs.gitlab.com/ee/ci/
- Workers Deployment: https://developers.cloudflare.com/workers/
