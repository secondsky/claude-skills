/**
 * Rust Worker Template for Cloudflare Workers
 *
 * Production-ready patterns for:
 * - Request routing
 * - Cloudflare bindings (KV, D1, R2)
 * - Error handling
 * - JSON serialization
 *
 * Setup:
 * 1. cargo install wasm-pack worker-build
 * 2. Copy Cargo.toml configuration below
 * 3. Copy this file to src/lib.rs
 * 4. Configure wrangler.jsonc
 * 5. Run: npx wrangler dev
 */

// ============================================
// CARGO.TOML
// ============================================

/*
[package]
name = "my-rust-worker"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
worker = "0.3"
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"
console_error_panic_hook = "0.1"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
futures = "0.3"
uuid = { version = "1.0", features = ["v4", "js"] }
chrono = { version = "0.4", features = ["wasmbind"] }

[profile.release]
opt-level = "s"
lto = true
codegen-units = 1
panic = "abort"
strip = true
*/

// ============================================
// WRANGLER.JSONC
// ============================================

/*
{
  "name": "my-rust-worker",
  "main": "build/worker/shim.mjs",
  "compatibility_date": "2024-12-01",
  "build": {
    "command": "cargo install -q worker-build && worker-build --release"
  },
  "kv_namespaces": [
    { "binding": "CACHE", "id": "xxx" }
  ],
  "d1_databases": [
    { "binding": "DB", "database_name": "my-db", "database_id": "xxx" }
  ],
  "r2_buckets": [
    { "binding": "STORAGE", "bucket_name": "my-bucket" }
  ]
}
*/

// ============================================
// MAIN WORKER CODE (src/lib.rs)
// ============================================

use serde::{Deserialize, Serialize};
use worker::*;

// ============================================
// TYPE DEFINITIONS
// ============================================

#[derive(Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
}

#[derive(Deserialize)]
struct UpdateUserRequest {
    name: Option<String>,
    email: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct User {
    id: String,
    name: String,
    email: String,
    created_at: String,
}

#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

#[derive(Serialize)]
struct PaginatedResponse<T> {
    data: Vec<T>,
    page: u32,
    limit: u32,
    total: u32,
}

// ============================================
// MAIN ENTRY POINT
// ============================================

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    // Set up panic hook for debugging
    console_error_panic_hook::set_once();

    // Router with all routes
    Router::new()
        // Health check
        .get("/health", handle_health)
        // User CRUD
        .get("/api/users", handle_list_users)
        .post("/api/users", handle_create_user)
        .get("/api/users/:id", handle_get_user)
        .put("/api/users/:id", handle_update_user)
        .delete("/api/users/:id", handle_delete_user)
        // Cache example
        .get("/api/cached/:key", handle_cache_get)
        .put("/api/cached/:key", handle_cache_set)
        // Storage example
        .get("/api/files/:key", handle_file_get)
        .put("/api/files/:key", handle_file_upload)
        // CPU-intensive
        .post("/api/compute", handle_compute)
        // Default
        .get("/", handle_index)
        .run(req, env)
        .await
}

// ============================================
// ROUTE HANDLERS
// ============================================

async fn handle_index(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    Response::ok("Rust Worker API v1.0")
}

async fn handle_health(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    Response::from_json(&serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

// ============================================
// USER CRUD HANDLERS
// ============================================

async fn handle_list_users(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let url = req.url()?;
    let query: std::collections::HashMap<_, _> = url.query_pairs().collect();

    let page: u32 = query
        .get("page")
        .and_then(|p| p.parse().ok())
        .unwrap_or(1);
    let limit: u32 = query
        .get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(10)
        .min(100);
    let offset = (page - 1) * limit;

    let db = ctx.env.d1("DB")?;

    // Get users with pagination
    let users = db
        .prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?")
        .bind(&[limit.into(), offset.into()])?
        .all()
        .await?
        .results::<User>()?;

    // Get total count
    let count: u32 = db
        .prepare("SELECT COUNT(*) as count FROM users")
        .first::<serde_json::Value>(None)
        .await?
        .and_then(|v| v.get("count").and_then(|c| c.as_u64()))
        .unwrap_or(0) as u32;

    let response = PaginatedResponse {
        data: users,
        page,
        limit,
        total: count,
    };

    Response::from_json(&response)
}

async fn handle_create_user(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Parse body
    let input: CreateUserRequest = match req.json().await {
        Ok(data) => data,
        Err(_) => {
            return Response::from_json(&ApiResponse::<()> {
                success: false,
                data: None,
                error: Some("Invalid JSON body".to_string()),
            })
            .map(|r| r.with_status(400));
        }
    };

    // Validate
    if input.name.trim().is_empty() {
        return Response::from_json(&ApiResponse::<()> {
            success: false,
            data: None,
            error: Some("Name is required".to_string()),
        })
        .map(|r| r.with_status(400));
    }

    if !input.email.contains('@') {
        return Response::from_json(&ApiResponse::<()> {
            success: false,
            data: None,
            error: Some("Invalid email".to_string()),
        })
        .map(|r| r.with_status(400));
    }

    let db = ctx.env.d1("DB")?;

    // Check for existing email
    let existing = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(&[input.email.to_lowercase().into()])?
        .first::<serde_json::Value>(None)
        .await?;

    if existing.is_some() {
        return Response::from_json(&ApiResponse::<()> {
            success: false,
            data: None,
            error: Some("Email already exists".to_string()),
        })
        .map(|r| r.with_status(409));
    }

    // Create user
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    db.prepare("INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)")
        .bind(&[
            id.clone().into(),
            input.name.trim().into(),
            input.email.to_lowercase().into(),
            now.clone().into(),
        ])?
        .run()
        .await?;

    let user = User {
        id,
        name: input.name.trim().to_string(),
        email: input.email.to_lowercase(),
        created_at: now,
    };

    Response::from_json(&ApiResponse {
        success: true,
        data: Some(user),
        error: None,
    })
    .map(|r| r.with_status(201))
}

async fn handle_get_user(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let id = ctx.param("id").unwrap();
    let db = ctx.env.d1("DB")?;

    let user = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(&[id.into()])?
        .first::<User>(None)
        .await?;

    match user {
        Some(user) => Response::from_json(&ApiResponse {
            success: true,
            data: Some(user),
            error: None,
        }),
        None => Response::from_json(&ApiResponse::<()> {
            success: false,
            data: None,
            error: Some("User not found".to_string()),
        })
        .map(|r| r.with_status(404)),
    }
}

async fn handle_update_user(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let id = ctx.param("id").unwrap();
    let db = ctx.env.d1("DB")?;

    // Check if user exists
    let existing = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(&[id.into()])?
        .first::<User>(None)
        .await?;

    let mut user = match existing {
        Some(u) => u,
        None => {
            return Response::from_json(&ApiResponse::<()> {
                success: false,
                data: None,
                error: Some("User not found".to_string()),
            })
            .map(|r| r.with_status(404));
        }
    };

    // Parse update data
    let input: UpdateUserRequest = match req.json().await {
        Ok(data) => data,
        Err(_) => {
            return Response::from_json(&ApiResponse::<()> {
                success: false,
                data: None,
                error: Some("Invalid JSON body".to_string()),
            })
            .map(|r| r.with_status(400));
        }
    };

    // Apply updates
    if let Some(name) = input.name {
        if name.trim().is_empty() {
            return Response::from_json(&ApiResponse::<()> {
                success: false,
                data: None,
                error: Some("Name cannot be empty".to_string()),
            })
            .map(|r| r.with_status(400));
        }
        user.name = name.trim().to_string();
    }

    if let Some(email) = input.email {
        if !email.contains('@') {
            return Response::from_json(&ApiResponse::<()> {
                success: false,
                data: None,
                error: Some("Invalid email".to_string()),
            })
            .map(|r| r.with_status(400));
        }
        user.email = email.to_lowercase();
    }

    // Update in database
    db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?")
        .bind(&[user.name.clone().into(), user.email.clone().into(), id.into()])?
        .run()
        .await?;

    Response::from_json(&ApiResponse {
        success: true,
        data: Some(user),
        error: None,
    })
}

async fn handle_delete_user(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let id = ctx.param("id").unwrap();
    let db = ctx.env.d1("DB")?;

    let result = db
        .prepare("DELETE FROM users WHERE id = ?")
        .bind(&[id.into()])?
        .run()
        .await?;

    if result.meta().map(|m| m.changes).unwrap_or(0) == 0 {
        return Response::from_json(&ApiResponse::<()> {
            success: false,
            data: None,
            error: Some("User not found".to_string()),
        })
        .map(|r| r.with_status(404));
    }

    Response::from_json(&ApiResponse::<()> {
        success: true,
        data: None,
        error: None,
    })
}

// ============================================
// KV CACHE HANDLERS
// ============================================

async fn handle_cache_get(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let key = ctx.param("key").unwrap();
    let kv = ctx.kv("CACHE")?;

    let value = kv.get(key).text().await?;

    match value {
        Some(v) => Response::ok(v),
        None => Response::error("Not found", 404),
    }
}

async fn handle_cache_set(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let key = ctx.param("key").unwrap();
    let kv = ctx.kv("CACHE")?;

    let body = req.text().await?;

    // Set with 1 hour expiration
    kv.put(key, body)?
        .expiration_ttl(3600)
        .execute()
        .await?;

    Response::ok("Cached")
}

// ============================================
// R2 STORAGE HANDLERS
// ============================================

async fn handle_file_get(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let key = ctx.param("key").unwrap();
    let bucket = ctx.bucket("STORAGE")?;

    let object = bucket.get(key).execute().await?;

    match object {
        Some(obj) => {
            let body = obj.body().unwrap();
            let bytes = body.bytes().await?;

            let content_type = obj
                .http_metadata()
                .content_type
                .unwrap_or("application/octet-stream".to_string());

            let mut headers = Headers::new();
            headers.set("Content-Type", &content_type)?;

            Ok(Response::from_bytes(bytes)?.with_headers(headers))
        }
        None => Response::error("Not found", 404),
    }
}

async fn handle_file_upload(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let key = ctx.param("key").unwrap();
    let bucket = ctx.bucket("STORAGE")?;

    let content_type = req
        .headers()
        .get("Content-Type")?
        .unwrap_or("application/octet-stream".to_string());

    let bytes = req.bytes().await?;

    bucket
        .put(key, bytes)
        .http_metadata(worker::HttpMetadata {
            content_type: Some(content_type),
            ..Default::default()
        })
        .execute()
        .await?;

    Response::ok("Uploaded")
}

// ============================================
// CPU-INTENSIVE COMPUTATION
// ============================================

#[derive(Deserialize)]
struct ComputeRequest {
    data: Vec<f64>,
    operation: String,
}

#[derive(Serialize)]
struct ComputeResult {
    result: f64,
    operation: String,
    count: usize,
}

async fn handle_compute(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let input: ComputeRequest = match req.json().await {
        Ok(data) => data,
        Err(_) => {
            return Response::from_json(&ApiResponse::<()> {
                success: false,
                data: None,
                error: Some("Invalid JSON".to_string()),
            })
            .map(|r| r.with_status(400));
        }
    };

    if input.data.is_empty() {
        return Response::from_json(&ApiResponse::<()> {
            success: false,
            data: None,
            error: Some("Data array is empty".to_string()),
        })
        .map(|r| r.with_status(400));
    }

    let result = match input.operation.as_str() {
        "sum" => input.data.iter().sum(),
        "mean" => input.data.iter().sum::<f64>() / input.data.len() as f64,
        "max" => input.data.iter().cloned().fold(f64::NEG_INFINITY, f64::max),
        "min" => input.data.iter().cloned().fold(f64::INFINITY, f64::min),
        "std" => {
            let mean = input.data.iter().sum::<f64>() / input.data.len() as f64;
            let variance = input
                .data
                .iter()
                .map(|x| (x - mean).powi(2))
                .sum::<f64>()
                / input.data.len() as f64;
            variance.sqrt()
        }
        _ => {
            return Response::from_json(&ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(format!("Unknown operation: {}", input.operation)),
            })
            .map(|r| r.with_status(400));
        }
    };

    Response::from_json(&ApiResponse {
        success: true,
        data: Some(ComputeResult {
            result,
            operation: input.operation,
            count: input.data.len(),
        }),
        error: None,
    })
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_sum() {
        let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let sum: f64 = data.iter().sum();
        assert_eq!(sum, 15.0);
    }

    #[test]
    fn test_compute_mean() {
        let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let mean = data.iter().sum::<f64>() / data.len() as f64;
        assert_eq!(mean, 3.0);
    }

    #[test]
    fn test_email_validation() {
        assert!("test@example.com".contains('@'));
        assert!(!"invalid".contains('@'));
    }
}
