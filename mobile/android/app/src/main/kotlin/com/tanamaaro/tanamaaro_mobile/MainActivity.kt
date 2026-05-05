package com.tanamaaro.tanamaaro_mobile

import android.os.Bundle
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Must be called BEFORE super.onCreate() so the SplashScreen API
        // can take control before any window is attached.
        installSplashScreen()
        super.onCreate(savedInstanceState)
    }
}
