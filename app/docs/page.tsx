"use client"

import { useState } from "react"
import { Code, Copy, Check, Book, Globe, Key, Send, Wallet } from "lucide-react"

const API_BASE = "https://your-wallet-domain.com/api"

const languages = [
  { id: "javascript", name: "JavaScript", icon: "📜" },
  { id: "nodejs", name: "Node.js", icon: "🟢" },
  { id: "python", name: "Python", icon: "🐍" },
  { id: "curl", name: "cURL", icon: "💻" },
  { id: "php", name: "PHP", icon: "🐘" },
  { id: "ruby", name: "Ruby", icon: "💎" },
  { id: "go", name: "Go", icon: "🐹" },
  { id: "java", name: "Java", icon: "☕" },
  { id: "csharp", name: "C#", icon: "🔷" },
  { id: "rust", name: "Rust", icon: "🦀" },
  { id: "swift", name: "Swift", icon: "🐦" },
  { id: "kotlin", name: "Kotlin", icon: "🟣" },
]

const codeExamples: Record<string, Record<string, string>> = {
  javascript: {
    check: `// Check if wallet exists
const checkWallet = async () => {
  const response = await fetch('${API_BASE}/wallet/status', {
    credentials: 'include' // Important: sends cookies
  })
  const data = await response.json()
  
  if (data.hasWallet) {
    console.log('Wallet found:', data.address)
    return data.address
  } else {
    console.log('No wallet found')
    return null
  }
}`,
    connect: `// Connect wallet
const connectWallet = async () => {
  const response = await fetch('${API_BASE}/wallet/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      returnUrl: window.location.href
    })
  })
  const { redirectUrl } = await response.json()
  
  // Redirect to wallet for approval
  window.location.href = redirectUrl
}`,
    sign: `// Sign message
const signMessage = async (message) => {
  const response = await fetch('${API_BASE}/wallet/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      message: message,
      returnUrl: window.location.href
    })
  })
  const { redirectUrl } = await response.json()
  
  window.location.href = redirectUrl
}`,
    transaction: `// Send transaction
const sendTransaction = async (tx) => {
  const response = await fetch('${API_BASE}/wallet/transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      tx: {
        to: tx.to,
        value: tx.value,
        data: tx.data
      },
      returnUrl: window.location.href
    })
  })
  const { redirectUrl } = await response.json()
  
  window.location.href = redirectUrl
}`,
  },
  nodejs: {
    check: `// Check if wallet exists
const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');

const checkWallet = async (cookieJar) => {
  const response = await fetch('${API_BASE}/wallet/status', {
    headers: {
      'Cookie': cookieJar.getCookieStringSync('${API_BASE}')
    }
  });
  
  const data = await response.json();
  
  if (data.hasWallet) {
    console.log('Wallet found:', data.address);
    return data.address;
  }
  return null;
};`,
    connect: `// Connect wallet
const connectWallet = async (cookieJar) => {
  const response = await fetch('${API_BASE}/wallet/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieJar.getCookieStringSync('${API_BASE}')
    },
    body: JSON.stringify({
      returnUrl: 'https://your-dapp.com'
    })
  });
  
  const { redirectUrl } = await response.json();
  return redirectUrl;
};`,
    sign: `// Sign message
const signMessage = async (message, cookieJar) => {
  const response = await fetch('${API_BASE}/wallet/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieJar.getCookieStringSync('${API_BASE}')
    },
    body: JSON.stringify({
      message: message,
      returnUrl: 'https://your-dapp.com'
    })
  });
  
  const { redirectUrl } = await response.json();
  return redirectUrl;
};`,
    transaction: `// Send transaction
const sendTransaction = async (tx, cookieJar) => {
  const response = await fetch('${API_BASE}/wallet/transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieJar.getCookieStringSync('${API_BASE}')
    },
    body: JSON.stringify({
      tx: {
        to: tx.to,
        value: tx.value,
        data: tx.data
      },
      returnUrl: 'https://your-dapp.com'
    })
  });
  
  const { redirectUrl } = await response.json();
  return redirectUrl;
};`,
  },
  python: {
    check: `# Check if wallet exists
import requests

def check_wallet(session):
    response = session.get('${API_BASE}/wallet/status')
    data = response.json()
    
    if data.get('hasWallet'):
        print(f"Wallet found: {data['address']}")
        return data['address']
    return None

# Usage
session = requests.Session()
address = check_wallet(session)`,
    connect: `# Connect wallet
import requests

def connect_wallet(session, return_url):
    response = session.post(
        '${API_BASE}/wallet/connect',
        json={'returnUrl': return_url}
    )
    data = response.json()
    return data['redirectUrl']

# Usage
session = requests.Session()
redirect_url = connect_wallet(session, 'https://your-dapp.com')`,
    sign: `# Sign message
import requests

def sign_message(session, message, return_url):
    response = session.post(
        '${API_BASE}/wallet/sign',
        json={
            'message': message,
            'returnUrl': return_url
        }
    )
    data = response.json()
    return data['redirectUrl']

# Usage
session = requests.Session()
redirect_url = sign_message(session, 'Hello World', 'https://your-dapp.com')`,
    transaction: `# Send transaction
import requests

def send_transaction(session, tx, return_url):
    response = session.post(
        '${API_BASE}/wallet/transaction',
        json={
            'tx': {
                'to': tx['to'],
                'value': tx['value'],
                'data': tx['data']
            },
            'returnUrl': return_url
        }
    )
    data = response.json()
    return data['redirectUrl']

# Usage
session = requests.Session()
tx = {
    'to': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    'value': '0x0',
    'data': '0x'
}
redirect_url = send_transaction(session, tx, 'https://your-dapp.com')`,
  },
  curl: {
    check: `# Check if wallet exists
curl -X GET '${API_BASE}/wallet/status' \\
  -H 'Cookie: unchained_user_id=usr_1234567890_abc123'`,
    connect: `# Connect wallet
curl -X POST '${API_BASE}/wallet/connect' \\
  -H 'Content-Type: application/json' \\
  -H 'Cookie: unchained_user_id=usr_1234567890_abc123' \\
  -d '{
    "returnUrl": "https://your-dapp.com"
  }'`,
    sign: `# Sign message
curl -X POST '${API_BASE}/wallet/sign' \\
  -H 'Content-Type: application/json' \\
  -H 'Cookie: unchained_user_id=usr_1234567890_abc123' \\
  -d '{
    "message": "Hello World",
    "returnUrl": "https://your-dapp.com"
  }'`,
    transaction: `# Send transaction
curl -X POST '${API_BASE}/wallet/transaction' \\
  -H 'Content-Type: application/json' \\
  -H 'Cookie: unchained_user_id=usr_1234567890_abc123' \\
  -d '{
    "tx": {
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "value": "0x0",
      "data": "0x"
    },
    "returnUrl": "https://your-dapp.com"
  }'`,
  },
  php: {
    check: `<?php
// Check if wallet exists
function checkWallet($cookie) {
    $ch = curl_init('${API_BASE}/wallet/status');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Cookie: unchained_user_id=' . $cookie
    ]);
    
    $response = curl_exec($ch);
    $data = json_decode($response, true);
    curl_close($ch);
    
    if ($data['hasWallet']) {
        return $data['address'];
    }
    return null;
}
?>`,
    connect: `<?php
// Connect wallet
function connectWallet($cookie, $returnUrl) {
    $ch = curl_init('${API_BASE}/wallet/connect');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Cookie: unchained_user_id=' . $cookie
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'returnUrl' => $returnUrl
    ]));
    
    $response = curl_exec($ch);
    $data = json_decode($response, true);
    curl_close($ch);
    
    return $data['redirectUrl'];
}
?>`,
    sign: `<?php
// Sign message
function signMessage($cookie, $message, $returnUrl) {
    $ch = curl_init('${API_BASE}/wallet/sign');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Cookie: unchained_user_id=' . $cookie
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'message' => $message,
        'returnUrl' => $returnUrl
    ]));
    
    $response = curl_exec($ch);
    $data = json_decode($response, true);
    curl_close($ch);
    
    return $data['redirectUrl'];
}
?>`,
    transaction: `<?php
// Send transaction
function sendTransaction($cookie, $tx, $returnUrl) {
    $ch = curl_init('${API_BASE}/wallet/transaction');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Cookie: unchained_user_id=' . $cookie
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'tx' => $tx,
        'returnUrl' => $returnUrl
    ]));
    
    $response = curl_exec($ch);
    $data = json_decode($response, true);
    curl_close($ch);
    
    return $data['redirectUrl'];
}
?>`,
  },
  ruby: {
    check: `# Check if wallet exists
require 'net/http'
require 'json'

def check_wallet(cookie)
  uri = URI('${API_BASE}/wallet/status')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Get.new(uri)
  request['Cookie'] = "unchained_user_id=#{cookie}"
  
  response = http.request(request)
  data = JSON.parse(response.body)
  
  data['hasWallet'] ? data['address'] : nil
end`,
    connect: `# Connect wallet
require 'net/http'
require 'json'

def connect_wallet(cookie, return_url)
  uri = URI('${API_BASE}/wallet/connect')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri)
  request['Content-Type'] = 'application/json'
  request['Cookie'] = "unchained_user_id=#{cookie}"
  request.body = { returnUrl: return_url }.to_json
  
  response = http.request(request)
  data = JSON.parse(response.body)
  data['redirectUrl']
end`,
    sign: `# Sign message
require 'net/http'
require 'json'

def sign_message(cookie, message, return_url)
  uri = URI('${API_BASE}/wallet/sign')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri)
  request['Content-Type'] = 'application/json'
  request['Cookie'] = "unchained_user_id=#{cookie}"
  request.body = { message: message, returnUrl: return_url }.to_json
  
  response = http.request(request)
  data = JSON.parse(response.body)
  data['redirectUrl']
end`,
    transaction: `# Send transaction
require 'net/http'
require 'json'

def send_transaction(cookie, tx, return_url)
  uri = URI('${API_BASE}/wallet/transaction')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri)
  request['Content-Type'] = 'application/json'
  request['Cookie'] = "unchained_user_id=#{cookie}"
  request.body = { tx: tx, returnUrl: return_url }.to_json
  
  response = http.request(request)
  data = JSON.parse(response.body)
  data['redirectUrl']
end`,
  },
  go: {
    check: `// Check if wallet exists
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

func checkWallet(cookie string) (string, error) {
    req, _ := http.NewRequest("GET", "${API_BASE}/wallet/status", nil)
    req.Header.Set("Cookie", "unchained_user_id="+cookie)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var data map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&data)
    
    if data["hasWallet"].(bool) {
        return data["address"].(string), nil
    }
    return "", nil
}`,
    connect: `// Connect wallet
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func connectWallet(cookie, returnUrl string) (string, error) {
    payload := map[string]string{"returnUrl": returnUrl}
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "${API_BASE}/wallet/connect", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Cookie", "unchained_user_id="+cookie)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var data map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&data)
    return data["redirectUrl"].(string), nil
}`,
    sign: `// Sign message
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func signMessage(cookie, message, returnUrl string) (string, error) {
    payload := map[string]string{
        "message": message,
        "returnUrl": returnUrl,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "${API_BASE}/wallet/sign", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Cookie", "unchained_user_id="+cookie)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var data map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&data)
    return data["redirectUrl"].(string), nil
}`,
    transaction: `// Send transaction
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func sendTransaction(cookie string, tx map[string]string, returnUrl string) (string, error) {
    payload := map[string]interface{}{
        "tx": tx,
        "returnUrl": returnUrl,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "${API_BASE}/wallet/transaction", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Cookie", "unchained_user_id="+cookie)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var data map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&data)
    return data["redirectUrl"].(string), nil
}`,
  },
  java: {
    check: `// Check if wallet exists
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class UnchainedAPI {
    public String checkWallet(String cookie) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${API_BASE}/wallet/status"))
            .header("Cookie", "unchained_user_id=" + cookie)
            .GET()
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        // Parse JSON response
        // Use your preferred JSON library (e.g., Jackson, Gson)
        return response.body();
    }
}`,
    connect: `// Connect wallet
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class UnchainedAPI {
    public String connectWallet(String cookie, String returnUrl) throws Exception {
        String json = "{\"returnUrl\":\"" + returnUrl + "\"}";
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${API_BASE}/wallet/connect"))
            .header("Content-Type", "application/json")
            .header("Cookie", "unchained_user_id=" + cookie)
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        // Parse JSON to get redirectUrl
        return response.body();
    }
}`,
    sign: `// Sign message
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class UnchainedAPI {
    public String signMessage(String cookie, String message, String returnUrl) throws Exception {
        String json = String.format(
            "{\"message\":\"%s\",\"returnUrl\":\"%s\"}", 
            message, returnUrl
        );
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${API_BASE}/wallet/sign"))
            .header("Content-Type", "application/json")
            .header("Cookie", "unchained_user_id=" + cookie)
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        return response.body();
    }
}`,
    transaction: `// Send transaction
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class UnchainedAPI {
    public String sendTransaction(String cookie, Transaction tx, String returnUrl) throws Exception {
        String json = String.format(
            "{\"tx\":{\"to\":\"%s\",\"value\":\"%s\",\"data\":\"%s\"},\"returnUrl\":\"%s\"}",
            tx.to, tx.value, tx.data, returnUrl
        );
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${API_BASE}/wallet/transaction"))
            .header("Content-Type", "application/json")
            .header("Cookie", "unchained_user_id=" + cookie)
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        return response.body();
    }
}`,
  },
  csharp: {
    check: `// Check if wallet exists
using System.Net.Http;
using System.Text.Json;

public class UnchainedAPI {
    private HttpClient client = new HttpClient();
    
    public async Task<string> CheckWallet(string cookie) {
        var request = new HttpRequestMessage(HttpMethod.Get, "${API_BASE}/wallet/status");
        request.Headers.Add("Cookie", $"unchained_user_id={cookie}");
        
        var response = await client.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();
        var data = JsonSerializer.Deserialize<Dictionary<string, object>>(json);
        
        if (data["hasWallet"].ToString() == "True") {
            return data["address"].ToString();
        }
        return null;
    }
}`,
    connect: `// Connect wallet
using System.Net.Http;
using System.Text;
using System.Text.Json;

public class UnchainedAPI {
    private HttpClient client = new HttpClient();
    
    public async Task<string> ConnectWallet(string cookie, string returnUrl) {
        var payload = new { returnUrl = returnUrl };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var request = new HttpRequestMessage(HttpMethod.Post, "${API_BASE}/wallet/connect") {
            Content = content
        };
        request.Headers.Add("Cookie", $"unchained_user_id={cookie}");
        
        var response = await client.SendAsync(request);
        var responseJson = await response.Content.ReadAsStringAsync();
        var data = JsonSerializer.Deserialize<Dictionary<string, object>>(responseJson);
        
        return data["redirectUrl"].ToString();
    }
}`,
    sign: `// Sign message
using System.Net.Http;
using System.Text;
using System.Text.Json;

public class UnchainedAPI {
    private HttpClient client = new HttpClient();
    
    public async Task<string> SignMessage(string cookie, string message, string returnUrl) {
        var payload = new { message = message, returnUrl = returnUrl };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var request = new HttpRequestMessage(HttpMethod.Post, "${API_BASE}/wallet/sign") {
            Content = content
        };
        request.Headers.Add("Cookie", $"unchained_user_id={cookie}");
        
        var response = await client.SendAsync(request);
        var responseJson = await response.Content.ReadAsStringAsync();
        var data = JsonSerializer.Deserialize<Dictionary<string, object>>(responseJson);
        
        return data["redirectUrl"].ToString();
    }
}`,
    transaction: `// Send transaction
using System.Net.Http;
using System.Text;
using System.Text.Json;

public class UnchainedAPI {
    private HttpClient client = new HttpClient();
    
    public async Task<string> SendTransaction(string cookie, Transaction tx, string returnUrl) {
        var payload = new { 
            tx = new { to = tx.To, value = tx.Value, data = tx.Data },
            returnUrl = returnUrl 
        };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var request = new HttpRequestMessage(HttpMethod.Post, "${API_BASE}/wallet/transaction") {
            Content = content
        };
        request.Headers.Add("Cookie", $"unchained_user_id={cookie}");
        
        var response = await client.SendAsync(request);
        var responseJson = await response.Content.ReadAsStringAsync();
        var data = JsonSerializer.Deserialize<Dictionary<string, object>>(responseJson);
        
        return data["redirectUrl"].ToString();
    }
}`,
  },
  rust: {
    check: `// Check if wallet exists
use reqwest;
use serde_json::Value;

async fn check_wallet(cookie: &str) -> Result<Option<String>, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get("${API_BASE}/wallet/status")
        .header("Cookie", format!("unchained_user_id={}", cookie))
        .send()
        .await?;
    
    let data: Value = response.json().await?;
    
    if data["hasWallet"].as_bool().unwrap_or(false) {
        Ok(Some(data["address"].as_str().unwrap().to_string()))
    } else {
        Ok(None)
    }
}`,
    connect: `// Connect wallet
use reqwest;
use serde_json::json;

async fn connect_wallet(cookie: &str, return_url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .post("${API_BASE}/wallet/connect")
        .header("Content-Type", "application/json")
        .header("Cookie", format!("unchained_user_id={}", cookie))
        .json(&json!({"returnUrl": return_url}))
        .send()
        .await?;
    
    let data: Value = response.json().await?;
    Ok(data["redirectUrl"].as_str().unwrap().to_string())
}`,
    sign: `// Sign message
use reqwest;
use serde_json::json;

async fn sign_message(cookie: &str, message: &str, return_url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .post("${API_BASE}/wallet/sign")
        .header("Content-Type", "application/json")
        .header("Cookie", format!("unchained_user_id={}", cookie))
        .json(&json!({
            "message": message,
            "returnUrl": return_url
        }))
        .send()
        .await?;
    
    let data: Value = response.json().await?;
    Ok(data["redirectUrl"].as_str().unwrap().to_string())
}`,
    transaction: `// Send transaction
use reqwest;
use serde_json::json;

async fn send_transaction(
    cookie: &str,
    tx: &Transaction,
    return_url: &str
) -> Result<String, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .post("${API_BASE}/wallet/transaction")
        .header("Content-Type", "application/json")
        .header("Cookie", format!("unchained_user_id={}", cookie))
        .json(&json!({
            "tx": {
                "to": tx.to,
                "value": tx.value,
                "data": tx.data
            },
            "returnUrl": return_url
        }))
        .send()
        .await?;
    
    let data: Value = response.json().await?;
    Ok(data["redirectUrl"].as_str().unwrap().to_string())
}`,
  },
  swift: {
    check: `// Check if wallet exists
import Foundation

func checkWallet(cookie: String, completion: @escaping (String?) -> Void) {
    var request = URLRequest(url: URL(string: "${API_BASE}/wallet/status")!)
    request.setValue("unchained_user_id=\(cookie)", forHTTPHeaderField: "Cookie")
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        guard let data = data,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let hasWallet = json["hasWallet"] as? Bool,
              hasWallet else {
            completion(nil)
            return
        }
        completion(json["address"] as? String)
    }.resume()
}`,
    connect: `// Connect wallet
import Foundation

func connectWallet(cookie: String, returnUrl: String, completion: @escaping (String?) -> Void) {
    var request = URLRequest(url: URL(string: "${API_BASE}/wallet/connect")!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("unchained_user_id=\(cookie)", forHTTPHeaderField: "Cookie")
    request.httpBody = try? JSONSerialization.data(withJSONObject: ["returnUrl": returnUrl])
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        guard let data = data,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            completion(nil)
            return
        }
        completion(json["redirectUrl"] as? String)
    }.resume()
}`,
    sign: `// Sign message
import Foundation

func signMessage(cookie: String, message: String, returnUrl: String, completion: @escaping (String?) -> Void) {
    var request = URLRequest(url: URL(string: "${API_BASE}/wallet/sign")!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("unchained_user_id=\(cookie)", forHTTPHeaderField: "Cookie")
    request.httpBody = try? JSONSerialization.data(withJSONObject: [
        "message": message,
        "returnUrl": returnUrl
    ])
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        guard let data = data,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            completion(nil)
            return
        }
        completion(json["redirectUrl"] as? String)
    }.resume()
}`,
    transaction: `// Send transaction
import Foundation

func sendTransaction(cookie: String, tx: Transaction, returnUrl: String, completion: @escaping (String?) -> Void) {
    var request = URLRequest(url: URL(string: "${API_BASE}/wallet/transaction")!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("unchained_user_id=\(cookie)", forHTTPHeaderField: "Cookie")
    request.httpBody = try? JSONSerialization.data(withJSONObject: [
        "tx": ["to": tx.to, "value": tx.value, "data": tx.data],
        "returnUrl": returnUrl
    ])
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        guard let data = data,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            completion(nil)
            return
        }
        completion(json["redirectUrl"] as? String)
    }.resume()
}`,
  },
  kotlin: {
    check: `// Check if wallet exists
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

fun checkWallet(cookie: String, callback: (String?) -> Unit) {
    val client = OkHttpClient()
    val request = Request.Builder()
        .url("${API_BASE}/wallet/status")
        .addHeader("Cookie", "unchained_user_id=$cookie")
        .build()
    
    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            val json = JSONObject(response.body?.string() ?: "")
            if (json.getBoolean("hasWallet")) {
                callback(json.getString("address"))
            } else {
                callback(null)
            }
        }
        override fun onFailure(call: Call, e: IOException) {
            callback(null)
        }
    })
}`,
    connect: `// Connect wallet
import okhttp3.*
import org.json.JSONObject

fun connectWallet(cookie: String, returnUrl: String, callback: (String?) -> Unit) {
    val client = OkHttpClient()
    val json = JSONObject().put("returnUrl", returnUrl)
    val body = RequestBody.create(
        MediaType.parse("application/json"),
        json.toString()
    )
    
    val request = Request.Builder()
        .url("${API_BASE}/wallet/connect")
        .post(body)
        .addHeader("Content-Type", "application/json")
        .addHeader("Cookie", "unchained_user_id=$cookie")
        .build()
    
    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            val json = JSONObject(response.body?.string() ?: "")
            callback(json.getString("redirectUrl"))
        }
        override fun onFailure(call: Call, e: IOException) {
            callback(null)
        }
    })
}`,
    sign: `// Sign message
import okhttp3.*
import org.json.JSONObject

fun signMessage(cookie: String, message: String, returnUrl: String, callback: (String?) -> Unit) {
    val client = OkHttpClient()
    val json = JSONObject()
        .put("message", message)
        .put("returnUrl", returnUrl)
    val body = RequestBody.create(
        MediaType.parse("application/json"),
        json.toString()
    )
    
    val request = Request.Builder()
        .url("${API_BASE}/wallet/sign")
        .post(body)
        .addHeader("Content-Type", "application/json")
        .addHeader("Cookie", "unchained_user_id=$cookie")
        .build()
    
    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            val json = JSONObject(response.body?.string() ?: "")
            callback(json.getString("redirectUrl"))
        }
        override fun onFailure(call: Call, e: IOException) {
            callback(null)
        }
    })
}`,
    transaction: `// Send transaction
import okhttp3.*
import org.json.JSONObject

fun sendTransaction(cookie: String, tx: Transaction, returnUrl: String, callback: (String?) -> Unit) {
    val client = OkHttpClient()
    val txJson = JSONObject()
        .put("to", tx.to)
        .put("value", tx.value)
        .put("data", tx.data)
    val json = JSONObject()
        .put("tx", txJson)
        .put("returnUrl", returnUrl)
    val body = RequestBody.create(
        MediaType.parse("application/json"),
        json.toString()
    )
    
    val request = Request.Builder()
        .url("${API_BASE}/wallet/transaction")
        .post(body)
        .addHeader("Content-Type", "application/json")
        .addHeader("Cookie", "unchained_user_id=$cookie")
        .build()
    
    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            val json = JSONObject(response.body?.string() ?: "")
            callback(json.getString("redirectUrl"))
        }
        override fun onFailure(call: Call, e: IOException) {
            callback(null)
        }
    })
}`,
  },
}

export default function DocsPage() {
  const [selectedLang, setSelectedLang] = useState("javascript")
  const [selectedMethod, setSelectedMethod] = useState("check")
  const [copied, setCopied] = useState("")

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(""), 2000)
  }

  const currentCode = codeExamples[selectedLang]?.[selectedMethod] || ""

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Book className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Unchained Wallet API</h1>
              <p className="text-gray-400">Complete integration guide for all programming languages</p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" />
            Quick Start
          </h2>
          <p className="text-gray-300 mb-4">
            The Unchained Wallet API is a simple REST API that enables your dApp to connect with user wallets.
            No SDK required - just make HTTP requests!
          </p>
          <div className="bg-black/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Base URL:</p>
            <code className="text-green-400">{API_BASE}</code>
          </div>
        </div>

        {/* Language Selector */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-green-500" />
            Choose Your Language
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedLang === lang.id
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl mb-2">{lang.icon}</div>
                <div className="text-sm font-semibold">{lang.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Method Selector */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">API Methods</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setSelectedMethod("check")}
              className={`p-4 rounded-lg border transition-all flex items-center gap-2 ${
                selectedMethod === "check"
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Check Wallet
            </button>
            <button
              onClick={() => setSelectedMethod("connect")}
              className={`p-4 rounded-lg border transition-all flex items-center gap-2 ${
                selectedMethod === "connect"
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <Key className="w-4 h-4" />
              Connect
            </button>
            <button
              onClick={() => setSelectedMethod("sign")}
              className={`p-4 rounded-lg border transition-all flex items-center gap-2 ${
                selectedMethod === "sign"
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <Key className="w-4 h-4" />
              Sign Message
            </button>
            <button
              onClick={() => setSelectedMethod("transaction")}
              className={`p-4 rounded-lg border transition-all flex items-center gap-2 ${
                selectedMethod === "transaction"
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <Send className="w-4 h-4" />
              Send Transaction
            </button>
          </div>
        </div>

        {/* Code Example */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {languages.find((l) => l.id === selectedLang)?.name} Example
            </h2>
            <button
              onClick={() => handleCopy(currentCode, `${selectedLang}-${selectedMethod}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              {copied === `${selectedLang}-${selectedMethod}` ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>
          <div className="bg-black/50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm">
              <code className="text-gray-300">{currentCode}</code>
            </pre>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">All Endpoints</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-lg mb-2">GET /wallet/status</h3>
              <p className="text-gray-400 mb-2">Check if user has a wallet</p>
              <code className="text-sm text-green-400">Returns: {"{ hasWallet: boolean, address?: string }"}</code>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-lg mb-2">POST /wallet/connect</h3>
              <p className="text-gray-400 mb-2">Initiate wallet connection</p>
              <code className="text-sm text-green-400">Body: {"{ returnUrl: string }"}</code>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-lg mb-2">POST /wallet/sign</h3>
              <p className="text-gray-400 mb-2">Request message signature</p>
              <code className="text-sm text-green-400">Body: {"{ message: string, returnUrl: string }"}</code>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-lg mb-2">POST /wallet/transaction</h3>
              <p className="text-gray-400 mb-2">Request transaction signing</p>
              <code className="text-sm text-green-400">
                Body: {"{ tx: { to, value, data }, returnUrl: string }"}
              </code>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-lg mb-2">GET /wallet/account</h3>
              <p className="text-gray-400 mb-2">Get wallet account information</p>
              <code className="text-sm text-green-400">Returns: {"{ address: string, chainId: number }"}</code>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-lg mb-2">POST /rpc</h3>
              <p className="text-gray-400 mb-2">Proxy RPC calls to blockchain</p>
              <code className="text-sm text-green-400">
                Body: {"{ method: string, params: any[], chainId?: number }"}
              </code>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Authentication</h2>
          <p className="text-gray-300 mb-4">
            All API requests use cookie-based authentication. The <code className="text-green-400">unchained_user_id</code> cookie
            is automatically set when a user creates a wallet.
          </p>
          <div className="bg-black/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Cookie Name:</p>
            <code className="text-green-400">unchained_user_id</code>
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Integration Flow</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-bold">Check Wallet Status</h3>
                <p className="text-gray-400 text-sm">Call GET /wallet/status to see if user has a wallet</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-bold">Connect Wallet</h3>
                <p className="text-gray-400 text-sm">If wallet exists, call POST /wallet/connect to initiate connection</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-bold">User Approves</h3>
                <p className="text-gray-400 text-sm">User is redirected to wallet, approves connection, and returns to your dApp</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-bold">4</span>
              </div>
              <div>
                <h3 className="font-bold">Use Wallet</h3>
                <p className="text-gray-400 text-sm">Now you can sign messages or send transactions using the API</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

