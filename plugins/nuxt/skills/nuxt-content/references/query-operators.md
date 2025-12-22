# Query Operators Quick Reference

## SQL Operators

### Equality & Comparison

```ts
// Equal to
.where('published', '=', true)

// Not equal
.where('status', '<>', 'draft')

// Greater than / Less than
.where('date', '>', '2024-01-01')
.where('price', '<', 1000)

// Greater/Less than or equal
.where('views', '>=', 100)
.where('score', '<=', 50)
```

### List Membership

```ts
// IN operator
.where('category', 'IN', ['news', 'tutorial'])

// NOT IN
.where('status', 'NOT IN', ['draft', 'archived'])
```

### Range

```ts
// BETWEEN
.where('date', 'BETWEEN', ['2024-01-01', '2024-12-31'])

// NOT BETWEEN
.where('price', 'NOT BETWEEN', [100, 500])
```

### Null Checks

```ts
// IS NULL
.where('deletedAt', 'IS NULL')

// IS NOT NULL
.where('publishedAt', 'IS NOT NULL')
```

### Pattern Matching

```ts
// LIKE (with % wildcard)
.where('title', 'LIKE', '%Nuxt%')
.where('email', 'LIKE', '%@gmail.com')

// NOT LIKE
.where('title', 'NOT LIKE', '%draft%')
```

---

## Combining Conditions

### AND Conditions (Default)

```ts
queryCollection('blog')
  .where('published', '=', true)
  .where('category', '=', 'tutorial')
  .where('date', '>', '2024-01-01')
  .all()
```

### Grouped AND

```ts
queryCollection('blog')
  .andWhere(q =>
    q.where('date', '>', '2024-01-01')
     .where('category', '=', 'news')
  )
  .all()
```

### OR Conditions

```ts
queryCollection('blog')
  .orWhere(q =>
    q.where('featured', '=', true)
     .where('priority', '>', 5)
  )
  .all()
```

### Complex Conditions

```ts
queryCollection('blog')
  .where('published', '=', true)
  .andWhere(q =>
    q.where('category', '=', 'news')
     .orWhere(sub =>
       sub.where('featured', '=', true)
     )
  )
  .all()
```

---

## Ordering

```ts
// Single field
.order('date', 'DESC')
.order('title', 'ASC')

// Multiple fields
.order('category', 'ASC')
.order('date', 'DESC')
```

---

## Pagination

```ts
// Limit
.limit(10)

// Skip and limit
.skip(5)
.limit(10)

// Page-based
const page = 2
const perPage = 10
.skip((page - 1) * perPage)
.limit(perPage)
```

---

## Field Selection

```ts
// Select specific fields
.select('path', 'title', 'description', 'date')

// Benefits: Smaller payload, faster queries
```

---

## Counting

```ts
const count = await queryCollection('blog')
  .where('published', '=', true)
  .count()
```

---

## Server-Side Queries

```ts
// Pass event as first argument
export default eventHandler(async (event) => {
  const posts = await queryCollection(event, 'blog').all()
  return posts
})
```

---

## Complete Query Example

```ts
// Get latest 10 published tutorials from 2024,
// ordered by date, with specific fields only
const tutorials = await queryCollection('blog')
  .where('published', '=', true)
  .where('category', '=', 'tutorial')
  .where('date', '>=', '2024-01-01')
  .select('path', 'title', 'description', 'date', 'author')
  .order('date', 'DESC')
  .limit(10)
  .all()
```
