# Architecture Patterns Skill

Master Clean Architecture, Hexagonal Architecture, and Domain-Driven Design for maintainable backend systems.

## Overview

This skill provides comprehensive guidance on implementing proven backend architecture patterns that separate concerns, improve testability, and create maintainable codebases.

## When to Use

- Designing new backend systems from scratch
- Refactoring monolithic applications
- Establishing architecture standards for your team
- Migrating to loosely coupled architectures
- Implementing domain-driven design principles
- Creating testable and mockable codebases
- Planning microservices decomposition

## Core Patterns

### Clean Architecture (Uncle Bob)
- Dependencies point inward
- Entities, Use Cases, Interface Adapters, Frameworks & Drivers
- Business logic independent of frameworks
- Testable without UI or database

### Hexagonal Architecture (Ports and Adapters)
- Domain core with business logic
- Ports define interfaces
- Adapters implement ports (database, REST, etc.)
- Swap implementations easily for testing

### Domain-Driven Design (DDD)
- Bounded Contexts and Context Mapping
- Entities with identity
- Value Objects (immutable)
- Aggregates as consistency boundaries
- Repositories for data access
- Domain Events

## Auto-Trigger Keywords

- clean architecture
- hexagonal architecture
- domain driven design
- DDD patterns
- ports and adapters
- dependency inversion
- use cases
- repository pattern
- value objects
- aggregates
- bounded contexts

## Source

Adapted from [wshobson/agents](https://github.com/wshobson/agents)
