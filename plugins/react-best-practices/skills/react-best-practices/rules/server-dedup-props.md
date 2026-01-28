# Avoid Duplicate Serialization in RSC Props

**Impact: LOW** – This pattern reduces network payload by preventing duplicate serialization.

## Key Principle

React Server Components deduplicate data based on object reference, not value. When you pass the same reference twice, it serializes once. Creating a new reference (through transformations) causes full re-serialization.

## The Problem

Transforming arrays or objects on the server before passing to client components creates duplicate serialization:

> "RSC→client serialization deduplicates by object reference, not value. Same reference = serialized once"

When you call `.toSorted()`, `.filter()`, or `.map()` on server-side data, you're creating new array/object references that must be serialized separately.

## The Solution

Move transformations to the client using `useMemo`:

- Server: send the original data once
- Client: apply sorting, filtering, or mapping as needed

## Impact Varies by Data Type

**High impact:** Primitive arrays (`string[]`, `number[]`) duplicate the entire array and all elements

**Low impact:** Object arrays duplicate only the array structure; individual objects remain deduplicated by reference

## Operations That Break Deduplication

Array methods (`.toSorted()`, `.filter()`, `.map()`, `.slice()`, spread syntax) and object spreading (`{...obj}`, `Object.assign()`) all create new references and trigger re-serialization.

**Exception:** Pass derived data when transformations are computationally expensive or unnecessary for the client.
