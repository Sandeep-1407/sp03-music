"""Runs in GitHub Actions after `npx cap add android`.
Adds the MediaScan plugin, video permissions and the SP02 icon to the generated Android project."""
import os, re, shutil, subprocess, glob

ROOT = os.path.dirname(os.path.abspath(__file__))          # app/android-src
APP = os.path.abspath(os.path.join(ROOT, '..'))             # app/
AND = os.path.join(APP, 'android', 'app', 'src', 'main')
PKG = os.path.join(AND, 'java', 'com', 'sandeep', 'sp03')
os.makedirs(PKG, exist_ok=True)

# 1) plugin + MainActivity
for jf in ('MusicNativePlugin.java', 'PlaybackService.java'):
    shutil.copy(os.path.join(ROOT, jf), os.path.join(PKG, jf))
with open(os.path.join(PKG, 'MainActivity.java'), 'w') as f:
    f.write('''package com.sandeep.sp03;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MusicNativePlugin.class);
        super.onCreate(savedInstanceState);
        // Keep the app below the phone's status bar and above the navigation bar (Android 15+ draws edge-to-edge).
        int bg = Color.parseColor("#1a1046");
        getWindow().getDecorView().setBackgroundColor(bg);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightStatusBars(false);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightNavigationBars(false);
        View web = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(web, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            lp.topMargin = bars.top;
            lp.leftMargin = bars.left;
            lp.rightMargin = bars.right;
            lp.bottomMargin = Math.max(bars.bottom, ime.bottom);
            v.setLayoutParams(lp);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(web);
    }
}
''')

# 2) manifest permissions
mf = os.path.join(AND, 'AndroidManifest.xml')
m = open(mf).read()
perms = [
    '<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />',
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
    '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />',
    '<uses-permission android:name="android.permission.WAKE_LOCK" />',
    '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />',
]
for p in perms:
    if p.split('"')[1] not in m:
        m = m.replace('</manifest>', '    ' + p + '\n</manifest>')
if 'requestLegacyExternalStorage' not in m:
    m = m.replace('<application', '<application\n        android:requestLegacyExternalStorage="true"', 1)
if 'PlaybackService' not in m:
    m = m.replace('</application>', '        <service android:name=".PlaybackService" android:exported="false" android:foregroundServiceType="mediaPlayback" />\n    </application>', 1)
open(mf, 'w').write(m)

# androidx.media for MediaSession + media notification
gr = os.path.join(APP, 'android', 'app', 'build.gradle')
g = open(gr).read()
if 'androidx.media:media' not in g:
    g = g.replace('dependencies {', 'dependencies {\n    implementation "androidx.media:media:1.7.0"', 1)
    open(gr, 'w').write(g)

# 3) icons (from the web app icon)
icon = os.path.join(APP, 'www', 'icon-512.png')
res = os.path.join(AND, 'res')
shutil.rmtree(os.path.join(res, 'mipmap-anydpi-v26'), ignore_errors=True)
sizes = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for d, px in sizes.items():
    folder = os.path.join(res, 'mipmap-' + d)
    os.makedirs(folder, exist_ok=True)
    for f in glob.glob(os.path.join(folder, 'ic_launcher*.png')):
        os.remove(f)
    for name in ('ic_launcher.png', 'ic_launcher_round.png'):
        subprocess.run(['convert', icon, '-resize', f'{px}x{px}', os.path.join(folder, name)], check=True)
print('Android project prepared')
