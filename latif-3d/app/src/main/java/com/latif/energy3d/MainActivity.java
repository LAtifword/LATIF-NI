package com.latif.energy3d;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Offline, standalone WebGL learning studio. No internet permission is requested. */
public final class MainActivity extends Activity {
    private WebView webView;
    private static final String BASE = "file:///android_asset/";
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(6, 18, 27));
        getWindow().setNavigationBarColor(Color.rgb(6, 18, 27));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(6, 18, 27));
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setDefaultTextEncodingName("UTF-8");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equals(uri.getScheme()) &&
                        uri.toString().startsWith(BASE) &&
                        ("index.html".equals(uri.getLastPathSegment()) ||
                         "3d.html".equals(uri.getLastPathSegment()))) return false;
                if ("https".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (Exception ignored) { }
                }
                return true;
            }
        });
        setContentView(webView);
        if (savedInstanceState == null) webView.loadUrl(BASE + "3d.html");
        else webView.restoreState(savedInstanceState);
    }
    @Override protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }
    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }
}
