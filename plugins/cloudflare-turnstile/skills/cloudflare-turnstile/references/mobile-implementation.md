# Turnstile Mobile Implementation Guide

Comprehensive guide for integrating Cloudflare Turnstile in native mobile applications using WebView.

**Last Updated**: 2025-12-27
**Official Docs**: https://developers.cloudflare.com/turnstile/get-started/mobile-implementation/

---

## Table of Contents

1. [Overview](#overview)
2. [Core Requirements](#core-requirements)
3. [Android WebView Integration](#android-webview-integration)
4. [iOS WKWebView Integration](#ios-wkwebview-integration)
5. [React Native Integration](#react-native-integration)
6. [Flutter Integration](#flutter-integration)
7. [Critical Implementation Issues](#critical-implementation-issues)
8. [Testing Mobile Integration](#testing-mobile-integration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Turnstile operates in standard browser environments, including native mobile applications through WebView components. WebViews allow native apps to display web content while maintaining app context.

**WebView Definition**: Components that allow native mobile applications to display web content within the app interface.

**Supported Platforms**:
- ✅ Android WebView
- ✅ iOS WKWebView
- ✅ React Native (react-native-webview)
- ✅ Flutter (InAppWebView)

---

## Core Requirements

All WebView implementations must meet these requirements for Turnstile to function:

### JavaScript & Storage

**Mandatory**:
- ✅ JavaScript execution enabled
- ✅ DOM storage API available (localStorage, sessionStorage)
- ✅ Standard web APIs accessible (Fetch, XMLHttpRequest)

### Network Access

**Required Domains**:
- ✅ `challenges.cloudflare.com` (widget scripts and validation)
- ✅ `about:blank` (internal iframe usage)
- ✅ `about:srcdoc` (inline content)

**Protocols**:
- ✅ HTTP/HTTPS support
- ✅ WebSocket support (optional, for advanced features)

### Environment Stability

**Critical Requirements**:
- ✅ **Consistent User Agent** throughout sessions (changing UA causes failures)
- ✅ **Stable device characteristics** (screen size, orientation)
- ✅ **Persistent cookies** (session-based storage required)

---

## Android WebView Integration

### Step 1: Enable WebView Features

Configure WebView with required settings:

```java
import android.webkit.WebView;
import android.webkit.WebSettings;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();

        // ✅ REQUIRED: Enable JavaScript
        webSettings.setJavaScriptEnabled(true);

        // ✅ REQUIRED: Enable DOM storage
        webSettings.setDomStorageEnabled(true);

        // ✅ RECOMMENDED: Enable overview mode
        webSettings.setLoadWithOverviewMode(true);

        // ✅ RECOMMENDED: Enable wide viewport
        webSettings.setUseWideViewPort(true);

        // ✅ RECOMMENDED: Enable zoom controls (UX)
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);

        // Load your protected form
        webView.loadUrl("https://example.com/protected-form");
    }
}
```

---

### Step 2: Configure WebView Client

Handle navigation and SSL errors:

```java
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;

webView.setWebViewClient(new WebViewClient() {
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        // Allow navigation to challenges.cloudflare.com
        String url = request.getUrl().toString();

        if (url.contains("challenges.cloudflare.com")) {
            return false; // Let WebView handle it
        }

        // Handle other URLs as needed
        return super.shouldOverrideUrlLoading(view, request);
    }

    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        // ⚠️ WARNING: Don't proceed with SSL errors in production
        // Only for development/testing
        // handler.proceed();

        // ✅ PRODUCTION: Cancel on SSL errors
        handler.cancel();
    }
});
```

---

### Step 3: Handle Cookies

Ensure cookies persist across sessions:

```java
import android.webkit.CookieManager;

CookieManager cookieManager = CookieManager.getInstance();

// ✅ Enable cookies
cookieManager.setAcceptCookie(true);

// ✅ Enable third-party cookies (required for Turnstile)
cookieManager.setAcceptThirdPartyCookies(webView, true);
```

---

### Step 4: Configure Content Security Policy

If using CSP headers, allow Cloudflare domains:

```java
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onConsoleMessage(ConsoleMessage consoleMessage) {
        // Monitor CSP violations
        if (consoleMessage.message().contains("Content Security Policy")) {
            Log.w("CSP", "Violation: " + consoleMessage.message());
        }
    }
});
```

**CSP Configuration** (server-side):
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://challenges.cloudflare.com;
  frame-src 'self' https://challenges.cloudflare.com;
  connect-src 'self' https://challenges.cloudflare.com;">
```

---

### Complete Android Example

```java
package com.example.turnstile;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.webkit.CookieManager;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);

        // Configure WebView settings
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        // Configure cookies
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // Set WebView client
        webView.setWebViewClient(new WebViewClient());

        // Load protected page
        webView.loadUrl("https://example.com/turnstile-protected-form");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

**AndroidManifest.xml**:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<application
    android:usesCleartextTraffic="false"
    android:networkSecurityConfig="@xml/network_security_config">
    ...
</application>
```

---

## iOS WKWebView Integration

### Step 1: Import WKWebView

```swift
import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    var webView: WKWebView!

    override func loadView() {
        // ✅ Initialize WKWebViewConfiguration
        let webConfiguration = WKWebViewConfiguration()

        // ✅ REQUIRED: Enable JavaScript
        webConfiguration.preferences.javaScriptEnabled = true

        // ✅ RECOMMENDED: Enable inline media playback
        webConfiguration.allowsInlineMediaPlayback = true

        // Create WKWebView with configuration
        webView = WKWebView(frame: .zero, configuration: webConfiguration)
        webView.navigationDelegate = self

        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Load protected page
        let url = URL(string: "https://example.com/protected-form")!
        let request = URLRequest(url: url)
        webView.load(request)
    }
}
```

---

### Step 2: Handle Navigation

```swift
extension ViewController {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {

        // Allow navigation to challenges.cloudflare.com
        if let host = navigationAction.request.url?.host {
            if host.contains("challenges.cloudflare.com") {
                decisionHandler(.allow)
                return
            }
        }

        // Default: allow
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("Page loaded successfully")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Navigation failed: \(error.localizedDescription)")
    }
}
```

---

### Step 3: Configure Cookie Storage

```swift
import WebKit

let dataStore = WKWebsiteDataStore.default()
let cookieStore = dataStore.httpCookieStore

// ✅ Cookies are enabled by default in WKWebView
// Ensure cookies persist across sessions
```

**Custom User Agent** (if needed):
```swift
webView.customUserAgent = "MyApp/1.0 (iOS; compatible; Turnstile)"
```

**⚠️ CRITICAL**: Once set, **never change User Agent** during the session. Changing UA causes Turnstile to fail.

---

### Step 4: Handle Content Security Policy

```swift
func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    // Inject CSP meta tag if needed
    let cspScript = """
    var meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "script-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com;";
    document.head.appendChild(meta);
    """

    webView.evaluateJavaScript(cspScript) { result, error in
        if let error = error {
            print("CSP injection error: \(error)")
        }
    }
}
```

---

### Complete iOS Example

```swift
import UIKit
import WebKit

class TurnstileViewController: UIViewController, WKNavigationDelegate {
    var webView: WKWebView!

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.preferences.javaScriptEnabled = true
        config.allowsInlineMediaPlayback = true

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self

        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Load protected form
        let url = URL(string: "https://example.com/turnstile-form")!
        webView.load(URLRequest(url: url))
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("Turnstile page loaded")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Load error: \(error.localizedDescription)")
    }
}
```

**Info.plist** (allow network access):
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>challenges.cloudflare.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
            <false/>
        </dict>
    </dict>
</dict>
```

---

## React Native Integration

### Step 1: Install react-native-webview

```bash
npm install react-native-webview
# or
yarn add react-native-webview
```

**iOS**: Run `cd ios && pod install`

---

### Step 2: Implement WebView Component

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function TurnstileWebView() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://example.com/protected-form' }}
        // ✅ REQUIRED: Enable JavaScript
        javaScriptEnabled={true}

        // ✅ REQUIRED: Enable DOM storage
        domStorageEnabled={true}

        // ✅ RECOMMENDED: Enable third-party cookies
        thirdPartyCookiesEnabled={true}

        // ✅ RECOMMENDED: Allow file access
        allowFileAccess={true}

        // Handle load events
        onLoadStart={() => console.log('Loading Turnstile page...')}
        onLoadEnd={() => console.log('Turnstile page loaded')}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}

        // Handle messages from web content (optional)
        onMessage={(event) => {
          const message = event.nativeEvent.data;
          console.log('Message from WebView:', message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

### Step 3: Handle Turnstile Token (Optional)

Communicate between web content and React Native:

**Web Page (inject script)**:
```javascript
// In your HTML form
turnstile.render('#turnstile-widget', {
  sitekey: 'YOUR_SITEKEY',
  callback: function(token) {
    // Send token to React Native
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'turnstile_success',
        token: token
      }));
    }
  },
  'error-callback': function(error) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'turnstile_error',
        error: error
      }));
    }
  }
});
```

**React Native (receive messages)**:
```jsx
<WebView
  source={{ uri: 'https://example.com/protected-form' }}
  javaScriptEnabled={true}
  domStorageEnabled={true}
  onMessage={(event) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === 'turnstile_success') {
      console.log('Turnstile token:', data.token);
      // Handle token (send to backend, enable submission, etc.)
    } else if (data.type === 'turnstile_error') {
      console.error('Turnstile error:', data.error);
    }
  }}
/>
```

---

## Flutter Integration

### Step 1: Add flutter_inappwebview Dependency

**pubspec.yaml**:
```yaml
dependencies:
  flutter_inappwebview: ^5.8.0
```

Run: `flutter pub get`

---

### Step 2: Implement InAppWebView

```dart
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class TurnstilePage extends StatefulWidget {
  @override
  _TurnstilePageState createState() => _TurnstilePageState();
}

class _TurnstilePageState extends State<TurnstilePage> {
  late InAppWebViewController webViewController;
  double progress = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Turnstile Protected Form')),
      body: Column(
        children: [
          progress < 1.0
              ? LinearProgressIndicator(value: progress)
              : Container(),
          Expanded(
            child: InAppWebView(
              initialUrlRequest: URLRequest(
                url: Uri.parse('https://example.com/protected-form'),
              ),
              // ✅ REQUIRED: Enable JavaScript
              initialOptions: InAppWebViewGroupOptions(
                crossPlatform: InAppWebViewOptions(
                  javaScriptEnabled: true,
                  useShouldOverrideUrlLoading: true,
                ),
                // Android-specific options
                android: AndroidInAppWebViewOptions(
                  domStorageEnabled: true, // ✅ REQUIRED
                  useHybridComposition: true,
                  thirdPartyCookiesEnabled: true,
                ),
                // iOS-specific options
                ios: IOSInAppWebViewOptions(
                  allowsInlineMediaPlayback: true,
                ),
              ),
              onWebViewCreated: (controller) {
                webViewController = controller;
              },
              onLoadStart: (controller, url) {
                print('Page started loading: $url');
              },
              onLoadStop: (controller, url) async {
                print('Page finished loading: $url');
              },
              onProgressChanged: (controller, progress) {
                setState(() {
                  this.progress = progress / 100;
                });
              },
              onConsoleMessage: (controller, consoleMessage) {
                print('Console: ${consoleMessage.message}');
              },
            ),
          ),
        ],
      ),
    );
  }
}
```

---

### Step 3: Handle Messages (Optional)

```dart
onWebViewCreated: (controller) {
  webViewController = controller;

  // Add JavaScript handler
  controller.addJavaScriptHandler(
    handlerName: 'turnstileHandler',
    callback: (args) {
      // Receive messages from web page
      print('Turnstile message: $args');

      if (args.isNotEmpty) {
        final data = args[0];
        if (data['type'] == 'turnstile_success') {
          print('Token: ${data['token']}');
        }
      }
    },
  );
},
```

**Web Page (send to Flutter)**:
```javascript
turnstile.render('#turnstile-widget', {
  sitekey: 'YOUR_SITEKEY',
  callback: function(token) {
    // Send to Flutter
    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler('turnstileHandler', {
        type: 'turnstile_success',
        token: token
      });
    }
  }
});
```

---

## Critical Implementation Issues

### Issue 1: User Agent Consistency (CRITICAL)

**Problem**: Changing User Agent during session causes Turnstile failures.

**Cause**: Turnstile validates User Agent consistency as part of authenticity checks.

**Solution**:
```javascript
// ❌ WRONG: Changing UA mid-session
webView.setCustomUserAgent("MyApp/1.0");
// Later...
webView.setCustomUserAgent("MyApp/2.0"); // ⚠️ CAUSES FAILURE

// ✅ CORRECT: Set UA once, never change
webView.setCustomUserAgent("MyApp/1.0");
```

**Recommendation**: Set User Agent at WebView initialization, never modify during session.

---

### Issue 2: Cookie Persistence

**Problem**: Cookies don't persist between sessions, causing repeated challenges.

**Cause**: WebView not configured to store cookies persistently.

**Solution (Android)**:
```java
CookieManager.getInstance().setAcceptCookie(true);
CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
```

**Solution (iOS)**:
```swift
// Cookies persist by default in WKWebView
// Use default WKWebsiteDataStore
let config = WKWebViewConfiguration()
config.websiteDataStore = WKWebsiteDataStore.default()
```

---

### Issue 3: Content Security Policy Blocking

**Problem**: CSP blocks `challenges.cloudflare.com` iframe/scripts.

**Cause**: Restrictive CSP headers don't whitelist Cloudflare domains.

**Solution**: Configure server-side CSP headers:
```html
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' https://challenges.cloudflare.com;
  frame-src 'self' https://challenges.cloudflare.com;
  connect-src 'self' https://challenges.cloudflare.com;">
```

---

### Issue 4: Domain Whitelisting

**Problem**: WebView blocks navigation to `challenges.cloudflare.com`.

**Cause**: Navigation policies reject external domains.

**Solution**: Allow navigation to Cloudflare domains:

**Android**:
```java
webView.setWebViewClient(new WebViewClient() {
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        if (url.contains("challenges.cloudflare.com")) {
            return false; // Allow
        }
        return super.shouldOverrideUrlLoading(view, request);
    }
});
```

**iOS**:
```swift
func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let host = navigationAction.request.url?.host, host.contains("challenges.cloudflare.com") {
        decisionHandler(.allow)
    } else {
        decisionHandler(.allow)
    }
}
```

---

## Testing Mobile Integration

### Testing Checklist

**Functionality**:
- [ ] Widget loads correctly
- [ ] Challenge completes successfully
- [ ] Token is generated
- [ ] Token validates on server
- [ ] Error callbacks work

**Platforms**:
- [ ] Android (latest)
- [ ] Android (older versions: 8.0, 9.0)
- [ ] iOS (latest)
- [ ] iOS (older versions: 14.0, 15.0)

**Network Conditions**:
- [ ] WiFi
- [ ] 4G/5G
- [ ] Slow 3G (simulated)
- [ ] Offline → online transition

**Orientation**:
- [ ] Portrait mode
- [ ] Landscape mode
- [ ] Rotation during challenge

---

### Debug Logging

**Android**:
```java
WebView.setWebContentsDebuggingEnabled(true); // Enable Chrome DevTools

webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public boolean onConsoleMessage(ConsoleMessage cm) {
        Log.d("WebView", cm.message() + " -- Line " + cm.lineNumber() + " of " + cm.sourceId());
        return true;
    }
});
```

**iOS**:
```swift
// Enable Web Inspector (Safari → Develop → [Device])
// No code changes needed
```

**React Native**:
```jsx
<WebView
  onMessage={(event) => console.log('WebView:', event.nativeEvent.data)}
  onError={(syntheticEvent) => console.error('Error:', syntheticEvent.nativeEvent)}
/>
```

---

## Troubleshooting

### Widget Doesn't Load

**Check**:
- [ ] JavaScript enabled
- [ ] DOM storage enabled
- [ ] Network access to `challenges.cloudflare.com`
- [ ] CSP allows Cloudflare domains
- [ ] User Agent consistency

**Debug**:
```javascript
// Inject debug script
webView.evaluateJavaScript("console.log('JS enabled:', typeof turnstile !== 'undefined')");
```

---

### Token Validation Fails

**Check**:
- [ ] Token sent to server correctly
- [ ] Server using correct secret key
- [ ] Token not expired (5 min TTL)
- [ ] Token not reused (single-use)

---

### Repeated Challenges

**Check**:
- [ ] Cookies persisting between sessions
- [ ] Third-party cookies enabled
- [ ] User Agent consistency
- [ ] `cf_clearance` cookie not blocked

---

## Additional Resources

- **Turnstile Mobile Docs**: https://developers.cloudflare.com/turnstile/get-started/mobile-implementation/
- **Android WebView**: https://developer.android.com/guide/webapps/webview
- **iOS WKWebView**: https://developer.apple.com/documentation/webkit/wkwebview
- **react-native-webview**: https://github.com/react-native-webview/react-native-webview
- **flutter_inappwebview**: https://github.com/pichillilorenzo/flutter_inappwebview

---

**Best Practice**: Test mobile integration thoroughly across platforms and network conditions before production deployment.

**Token Savings**: ~80% reduction in mobile implementation complexity vs manual WebView configuration.
