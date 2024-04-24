use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use actix_web::middleware::Logger;
use actix_cors::Cors;
use crypto_hash::{Algorithm, hex_digest};
use std::collections::HashMap;
use std::fmt::Debug;
use serde::Serialize;

/* Utility functions */

// Function to create Binance signature
fn create_binance_signature(secret_key: &str, params: &HashMap<&str, &str>) -> String {
    let params_string = params.iter()
        .map(|(key, value)| format!("{}={}", key, value))
        .collect::<Vec<String>>()
        .join("&");

    let signature = hex_digest(Algorithm::SHA256, format!("{}{}", params_string, secret_key).as_bytes());

    signature
}

async fn handle_request<T: Serialize + Debug>(
    method: &str,
    url: &str,
    request_body: Option<T>,
    headers: Option<&HashMap<&str, &str>>,
) -> Result<reqwest::Response, reqwest::Error> {
    let mut request_builder = reqwest::Client::new().request(reqwest::Method::from_bytes(method.as_bytes()).unwrap(), url);

    // Add request body if provided
    if let Some(body) = request_body {
        request_builder = request_builder.json(&body);
    }

    // Add headers if provided
    if let Some(headers_map) = headers {
        for (key, value) in headers_map {
            request_builder = request_builder.header(*key, *value);
        }
    }

    // Send the request and return the response
    request_builder.send().await
}

async fn handle_response(response_result: Result<reqwest::Response, reqwest::Error>) -> HttpResponse {
    match response_result {
        Ok(response) => {
            if let Ok(news_data) = response.json::<serde_json::Value>().await {
                HttpResponse::Ok().json(news_data)
            } else {
                HttpResponse::BadRequest().json(serde_json::json!({"error": "Failed to parse news data"}))
            }
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "An error occurred while fetching news"}))
    }
}

/* Endpoints */

async fn get_news(info: web::Json<OvermindRequest>) -> impl Responder {
    let api_key = info.overmindApiKey.clone();
    let url = "http://localhost:1989/v1/info/news";
    let request_body = OvermindRequest { overmindApiKey: api_key };

    match handle_request(url, request_body, "An error occurred while fetching news").await {
        Ok(response_result) => handle_response(Ok(response_result)).await,
        Err(e) => {
            eprintln!("Error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "An error occurred while fetching news"}))
        }
    }
}

async fn get_user_asset(info: web::Json<BinanceRequest>) -> impl Responder {
    let api_key = info.apiKey.clone();
    let api_secret = info.apiSecret.clone();
    let request_body = BinanceRequest { apiKey: api_key.clone(), apiSecret: api_secret.clone() };
    let now = chrono::Utc::now().timestamp_millis();

    let mut params = HashMap::new();
    params.insert("timestamp", now.to_string());
    params.insert("needBtcValuation", "true".to_string());
    let params: HashMap<&str, &str> = params.iter()
    .map(|(k, v)| (*k, v.as_str()))
    .collect();
    let signature = create_binance_signature(&api_secret, &params);
    let mut params = params;
    params.insert("signature", &signature);

    let base_url = "https://api3.binance.com";
    let endpoint = "/sapi/v3/asset/getUserAsset";
    let url = format!(
        "{}{}?{}",
        base_url,
        endpoint,
        serde_urlencoded::to_string(&params).unwrap()
    );

    let mut headers = HashMap::new();
    headers.insert("X-MBX-APIKEY", api_key);

    match handle_request(&url, request_body, "An error occurred while fetching news").await {
        Ok(response_result) => handle_response(Ok(response_result)).await,
        Err(e) => {
            eprintln!("Error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "An error occurred while fetching news"}))
        }
    }
}

#[allow(non_snake_case)]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
struct OvermindRequest {
    overmindApiKey: String,
}

#[allow(non_snake_case)]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
struct BinanceRequest {
    apiKey: String,
    apiSecret: String
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .wrap(Logger::default())
            .wrap(
                Cors::default() // Allow all origins by default
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header()
            )
            .route("/api/v1/info/news", web::post().to(get_news))
            .route("/api/v1/asset/getUserAsset", web::post().to(get_user_asset))
    })
        .bind("localhost:3000")?
        .run()
        .await
}
