package com.leveling.app;

import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Adicionar interface JavaScript para abrir configurações
        this.getBridge().getWebView().addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void openAppSettings() {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_SETTINGS);
                startActivity(intent);
            }
        }, "AndroidSettings");
    }
}
