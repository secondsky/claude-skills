# Rust Workers Development

Build high-performance Cloudflare Workers with Rust and WebAssembly.

## Why Rust for Workers?

- **Performance**: Near-native speed via WebAssembly
- **Memory Safety**: No garbage collection pauses
- **Type Safety**: Compile-time guarantees
- **Small Bundles**: Optimized WASM output
- **CPU-Intensive**: Ideal for crypto, parsing, computation

## Project Setup

```bash
# Prerequisites
rustup target add wasm32-unknown-unknown
cargo install wasm-pack worker-build

# Create project
npx wrangler generate my-rust-worker https://github.com/cloudflare/workers-sdk/tree/main/templates/experimental/worker-rust

# Or manual setup
cargo new --lib my-worker
cd my-worker
```

## Project Structure

```
my-worker/
├── src/
│   ├── lib.rs           # Main worker code
│   ├── utils.rs         # Utility functions
│   └── types.rs         # Type definitions
├── Cargo.toml
├── wrangler.jsonc
└── build.sh
```

## Cargo.toml Configuration

```toml
[package]
name = "my-worker"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
# Cloudflare Workers SDK
worker = "0.3"

# WASM bindings
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"

# Error handling
console_error_panic_hook = "0.1"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Async
futures = "0.3"

# Optional: HTTP client
reqwest = { version = "0.12", default-features = false, features = ["json"] }

[profile.release]
opt-level = "s"      # Optimize for size
lto = true           # Link-time optimization
codegen-units = 1    # Better optimization
panic = "abort"      # Smaller panic handling
strip = true         # Strip symbols
```

## Wrangler Configuration

```jsonc
// wrangler.jsonc
{
  "name": "my-rust-worker",
  "main": "build/worker/shim.mjs",
  "compatibility_date": "2024-12-01",
  "build": {
    "command": "cargo install -q worker-build && worker-build --release"
  }
}
```

## Basic Worker

```rust
// src/lib.rs
use worker::*;

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    // Set up panic hook for debugging
    console_error_panic_hook::set_once();

    // Router for handling different paths
    Router::new()
        .get("/", handle_index)
        .get("/api/data", handle_api)
        .post("/api/process", handle_process)
        .run(req, env)
        .await
}

async fn handle_index(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    Response::ok("Hello from Rust Worker!")
}

async fn handle_api(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Access environment bindings
    let kv = ctx.kv("MY_KV")?;
    let value = kv.get("key").text().await?;

    Response::ok(value.unwrap_or_default())
}

async fn handle_process(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let body: serde_json::Value = req.json().await?;
    let processed = process_data(&body);
    Response::from_json(&processed)
}

fn process_data(data: &serde_json::Value) -> serde_json::Value {
    // CPU-intensive processing
    serde_json::json!({
        "processed": true,
        "input": data,
    })
}
```

## Request Handling

```rust
use worker::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
}

#[derive(Serialize)]
struct User {
    id: String,
    name: String,
    email: String,
}

async fn handle_create_user(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Parse JSON body
    let input: CreateUserRequest = match req.json().await {
        Ok(data) => data,
        Err(_) => return Response::error("Invalid JSON", 400),
    };

    // Validate
    if input.name.is_empty() {
        return Response::error("Name is required", 400);
    }

    if !input.email.contains('@') {
        return Response::error("Invalid email", 400);
    }

    // Access D1 database
    let db = ctx.env.d1("DB")?;
    let id = uuid::Uuid::new_v4().to_string();

    db.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
        .bind(&[id.clone().into(), input.name.clone().into(), input.email.clone().into()])?
        .run()
        .await?;

    let user = User {
        id,
        name: input.name,
        email: input.email,
    };

    Response::from_json(&user).map(|r| r.with_status(201))
}

// Query parameters
async fn handle_search(req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let url = req.url()?;
    let query: std::collections::HashMap<_, _> = url.query_pairs().collect();

    let search_term = query.get("q").map(|s| s.as_ref()).unwrap_or("");
    let page: u32 = query.get("page")
        .and_then(|p| p.parse().ok())
        .unwrap_or(1);

    Response::ok(format!("Search: {}, Page: {}", search_term, page))
}

// Path parameters
async fn handle_user_by_id(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let id = ctx.param("id").unwrap();

    let db = ctx.env.d1("DB")?;
    let result = db.prepare("SELECT * FROM users WHERE id = ?")
        .bind(&[id.into()])?
        .first::<User>(None)
        .await?;

    match result {
        Some(user) => Response::from_json(&user),
        None => Response::error("User not found", 404),
    }
}
```

## Cloudflare Bindings

```rust
use worker::*;

async fn handle_bindings(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // KV Namespace
    let kv = ctx.kv("MY_KV")?;
    kv.put("key", "value")?.execute().await?;
    let value = kv.get("key").text().await?;

    // D1 Database
    let db = ctx.env.d1("DB")?;
    let results = db.prepare("SELECT * FROM users")
        .all()
        .await?;

    // R2 Bucket
    let bucket = ctx.bucket("MY_BUCKET")?;
    bucket.put("file.txt", "content".as_bytes().to_vec()).execute().await?;
    let object = bucket.get("file.txt").execute().await?;

    // Durable Object
    let namespace = ctx.durable_object("COUNTER")?;
    let id = namespace.id_from_name("my-counter")?;
    let stub = id.get_stub()?;
    let response = stub.fetch_with_str("/increment").await?;

    // Environment variables
    let api_key: String = ctx.env.var("API_KEY")?.to_string();
    let secret: String = ctx.env.secret("SECRET")?.to_string();

    Response::ok("Bindings accessed successfully")
}
```

## Durable Objects in Rust

```rust
use worker::*;

#[durable_object]
pub struct Counter {
    state: State,
    env: Env,
    count: u64,
}

#[durable_object]
impl DurableObject for Counter {
    fn new(state: State, env: Env) -> Self {
        Self {
            state,
            env,
            count: 0,
        }
    }

    async fn fetch(&mut self, req: Request) -> Result<Response> {
        // Load state
        self.count = self.state.storage().get("count").await?.unwrap_or(0);

        let url = req.url()?;
        let path = url.path();

        match path {
            "/increment" => {
                self.count += 1;
                self.state.storage().put("count", self.count).await?;
                Response::ok(format!("Count: {}", self.count))
            }
            "/decrement" => {
                self.count = self.count.saturating_sub(1);
                self.state.storage().put("count", self.count).await?;
                Response::ok(format!("Count: {}", self.count))
            }
            "/get" => {
                Response::ok(format!("Count: {}", self.count))
            }
            _ => Response::error("Not Found", 404),
        }
    }
}
```

## Error Handling

```rust
use worker::*;

// Custom error type
#[derive(Debug)]
enum AppError {
    Validation(String),
    Database(String),
    NotFound,
}

impl From<AppError> for worker::Error {
    fn from(e: AppError) -> Self {
        worker::Error::RustError(format!("{:?}", e))
    }
}

// Result type alias
type AppResult<T> = std::result::Result<T, AppError>;

async fn handle_with_errors(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    match process_request(req, ctx).await {
        Ok(response) => Ok(response),
        Err(AppError::Validation(msg)) => {
            Response::error(msg, 400)
        }
        Err(AppError::NotFound) => {
            Response::error("Not found", 404)
        }
        Err(AppError::Database(msg)) => {
            console_log!("Database error: {}", msg);
            Response::error("Internal server error", 500)
        }
    }
}

async fn process_request(mut req: Request, ctx: RouteContext<()>) -> AppResult<Response> {
    let body: serde_json::Value = req.json().await
        .map_err(|_| AppError::Validation("Invalid JSON".into()))?;

    if body.get("name").is_none() {
        return Err(AppError::Validation("Name required".into()));
    }

    Ok(Response::ok("Success").unwrap())
}
```

## CPU-Intensive Tasks

```rust
use worker::*;

// Image processing example
async fn handle_image_process(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let bytes = req.bytes().await?;

    // Process in chunks to avoid CPU limit
    let processed = process_image(&bytes)?;

    Response::from_bytes(processed)
}

fn process_image(data: &[u8]) -> Result<Vec<u8>> {
    // Use image crate for processing
    // Note: Add `image = "0.24"` to Cargo.toml
    Ok(data.to_vec()) // Placeholder
}

// Cryptography example
fn hash_data(data: &[u8]) -> String {
    use sha2::{Sha256, Digest};

    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();

    hex::encode(result)
}

// JSON parsing (faster than JS for large payloads)
fn parse_large_json(data: &str) -> Result<serde_json::Value> {
    serde_json::from_str(data)
        .map_err(|e| worker::Error::RustError(e.to_string()))
}
```

## Testing

```rust
// tests/integration.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_data() {
        let input = serde_json::json!({"value": 42});
        let output = process_data(&input);

        assert!(output.get("processed").unwrap().as_bool().unwrap());
    }

    #[test]
    fn test_validation() {
        let result = validate_email("test@example.com");
        assert!(result.is_ok());

        let result = validate_email("invalid");
        assert!(result.is_err());
    }
}
```

## Build and Deploy

```bash
# Development
npx wrangler dev

# Build only
worker-build --release

# Deploy
npx wrangler deploy

# Check bundle size
ls -lh build/worker/
```

## Optimization Tips

1. **Use `#[inline]`** for small, hot functions
2. **Enable LTO** in Cargo.toml
3. **Strip debug info** with `strip = true`
4. **Use `opt-level = "s"`** for size optimization
5. **Avoid `panic!`** - use `Result` for error handling
6. **Minimize allocations** - use references when possible
7. **Use `#[cold]`** for error paths
