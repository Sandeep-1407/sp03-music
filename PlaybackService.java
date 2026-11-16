package com.sandeep.sp03;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

/** Keeps SP03 alive while music plays (screen off / app in background) and shows lock-screen + notification controls. */
public class PlaybackService extends Service {
    static PlaybackService inst;
    static final String CH = "sp03_playback";
    static final int NID = 3303;
    static final Bundle pending = new Bundle();

    MediaSessionCompat ms;
    PowerManager.WakeLock wl;
    String title = "SP03", artist = "", album = "";
    long mediaId = 0, artFor = -1, position = 0, duration = 0;
    float rate = 1f;
    boolean playing = false, isForeground = false;
    Bitmap art;
    final Handler main = new Handler(Looper.getMainLooper());

    final BroadcastReceiver noisy = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) { if (playing) MusicNativePlugin.emit("pause", 0); }
    };

    /** called by the plugin (any thread) */
    static void update(Context ctx, Bundle b) {
        if (inst != null) { new Handler(Looper.getMainLooper()).post(() -> inst.apply(b)); return; }
        if (!b.getBoolean("playing", false)) { synchronized (pending) { pending.putAll(b); } return; }
        synchronized (pending) { pending.putAll(b); }
        Intent i = new Intent(ctx, PlaybackService.class);
        try { ContextCompat.startForegroundService(ctx, i); } catch (Exception ignored) {}
    }

    @Override
    public void onCreate() {
        super.onCreate();
        inst = this;
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            NotificationChannel ch = new NotificationChannel(CH, "Music playback", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        ms = new MediaSessionCompat(this, "SP03");
        ms.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { MusicNativePlugin.emit("play", 0); }
            @Override public void onPause() { MusicNativePlugin.emit("pause", 0); }
            @Override public void onSkipToNext() { MusicNativePlugin.emit("next", 0); }
            @Override public void onSkipToPrevious() { MusicNativePlugin.emit("prev", 0); }
            @Override public void onSeekTo(long pos) { MusicNativePlugin.emit("seek", pos); }
            @Override public void onStop() { MusicNativePlugin.emit("pause", 0); }
        });
        ms.setActive(true);
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SP03:playback");
        wl.setReferenceCounted(false);
        ContextCompat.registerReceiver(this, noisy, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY), ContextCompat.RECEIVER_NOT_EXPORTED);
        synchronized (pending) { if (!pending.isEmpty()) { Bundle b = new Bundle(pending); pending.clear(); apply(b); } }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String a = intent != null ? intent.getAction() : null;
        if (a != null && a.startsWith("sp03.")) MusicNativePlugin.emit(a.substring(5), 0);
        refresh();
        return START_NOT_STICKY;
    }

    void apply(Bundle b) {
        if (b.containsKey("title")) title = b.getString("title", "SP03");
        if (b.containsKey("artist")) artist = b.getString("artist", "");
        if (b.containsKey("album")) album = b.getString("album", "");
        if (b.containsKey("mediaId")) mediaId = b.getLong("mediaId", 0);
        if (b.containsKey("playing")) playing = b.getBoolean("playing", false);
        if (b.containsKey("position")) position = b.getLong("position", 0);
        if (b.containsKey("duration")) duration = b.getLong("duration", 0);
        if (b.containsKey("rate")) rate = b.getFloat("rate", 1f);
        if (mediaId != artFor) {
            artFor = mediaId;
            art = null;
            final long want = mediaId;
            if (want > 0) new Thread(() -> {
                Bitmap bm = MusicNativePlugin.loadArt(getApplicationContext(), want, 512);
                main.post(() -> { if (artFor == want) { art = bm; refresh(); } });
            }).start();
        }
        refresh();
    }

    PendingIntent act(String a, int code) {
        Intent i = new Intent(this, PlaybackService.class).setAction("sp03." + a);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    void refresh() {
        MediaMetadataCompat.Builder md = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, album)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration);
        if (art != null) md.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, art);
        ms.setMetadata(md.build());
        ms.setPlaybackState(new PlaybackStateCompat.Builder()
            .setActions(PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE | PlaybackStateCompat.ACTION_PLAY_PAUSE
                | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS | PlaybackStateCompat.ACTION_SEEK_TO | PlaybackStateCompat.ACTION_STOP)
            .setState(playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED, position, playing ? rate : 0f)
            .build());

        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent content = launch == null ? null : PendingIntent.getActivity(this, 1, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder nb = new NotificationCompat.Builder(this, CH)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(title)
            .setContentText(artist.isEmpty() ? album : artist)
            .setLargeIcon(art)
            .setContentIntent(content)
            .setDeleteIntent(act("pause", 5))
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(playing)
            .addAction(android.R.drawable.ic_media_previous, "Previous", act("prev", 2))
            .addAction(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, playing ? "Pause" : "Play", act(playing ? "pause" : "play", 3))
            .addAction(android.R.drawable.ic_media_next, "Next", act("next", 4))
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle().setMediaSession(ms.getSessionToken()).setShowActionsInCompactView(0, 1, 2));
        Notification n = nb.build();

        if (playing) {
            try {
                if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                else startForeground(NID, n);
                isForeground = true;
            } catch (Exception e) {
                ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NID, n);
            }
            if (!wl.isHeld()) wl.acquire(6 * 60 * 60 * 1000L);
        } else {
            if (isForeground) { stopForeground(Build.VERSION.SDK_INT >= 24 ? STOP_FOREGROUND_DETACH : 0); isForeground = false; }
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NID, n);
            if (wl.isHeld()) wl.release();
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        if (!playing) stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        inst = null;
        try { unregisterReceiver(noisy); } catch (Exception ignored) {}
        if (wl != null && wl.isHeld()) wl.release();
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancel(NID);
        if (ms != null) ms.release();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
