# Microservices Patterns Skill

Design distributed systems with service boundaries, event-driven communication, and resilience patterns.

## Overview

This skill provides comprehensive guidance on microservices architecture including service decomposition, inter-service communication, data management, and resilience patterns for building reliable distributed systems.

## When to Use

- Decomposing monoliths into microservices
- Designing service boundaries and contracts
- Implementing inter-service communication
- Managing distributed data and transactions
- Building resilient distributed systems
- Implementing service discovery and load balancing
- Designing event-driven architectures

## Core Patterns

### Service Decomposition
- By business capability
- By subdomain (DDD)
- Strangler Fig pattern for gradual migration
- API Gateway for aggregation

### Communication
- Synchronous: REST, gRPC, GraphQL
- Asynchronous: Event streaming (Kafka), Message queues (RabbitMQ, SQS)
- Request/Response vs Event-Driven

### Data Management
- Database per service (no shared databases)
- Saga pattern for distributed transactions
- Eventual consistency
- Compensating actions

### Resilience
- Circuit Breaker pattern
- Retry with exponential backoff
- Bulkhead isolation
- Health checks and service discovery

## Auto-Trigger Keywords

- microservices architecture
- service decomposition
- distributed systems
- event driven architecture
- saga pattern
- circuit breaker
- API gateway
- service mesh
- inter-service communication
- database per service
- eventual consistency

## Source

Adapted from [wshobson/agents](https://github.com/wshobson/agents)
