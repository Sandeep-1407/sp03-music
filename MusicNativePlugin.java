package com.sandeep.sp03;

import android.Manifest;
import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Size;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.ByteArrayOutputStream;
import java.io.File;

/** SP03: lists every song on the phone (MediaStore) and drives the background-playback notification. */
@CapacitorPlugin(
    name = "MusicNative",
    permissions = {
        @Permission(alias = "audio", strings = { Manifest.permission.READ_MEDIA_AUDIO }),
        @Permission(alias = "storage", strings = { Manifest.permission.READ_EXTERNAL_STORAGE }),
        @Permission(alias = "notify", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class MusicNativePlugin extends Plugin {
    static MusicNativePlugin inst;

    @Override
    public void load() { inst = this; }

    private String alias() { return Build.VERSION.SDK_INT >= 33 ? "audio" : "storage"; }
    private boolean granted() { return getPermissionState(alias()) == PermissionState.GRANTED; }

    @PluginMethod
    public void checkAccess(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", granted());
        call.resolve(r);
    }

    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33) requestPermissionForAliases(new String[] { "audio", "notify" }, call, "accessCallback");
        else if (granted()) checkAccess(call);
        else requestPermissionForAlias("storage", call, "accessCallback");
    }

    @PermissionCallback
    private void accessCallback(PluginCall call) { checkAccess(call); }

    @PluginMethod
    public void listSongs(PluginCall call) {
        if (!granted()) { call.reject("Music permission not granted"); return; }
        getBridge().execute(() -> {
            JSArray arr = new JSArray();
            Uri base = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            String[] cols = {
                MediaStore.Audio.Media._ID, MediaStore.Audio.Media.DISPLAY_NAME, MediaStore.Audio.Media.TITLE, MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM, MediaStore.Audio.Media.ALBUM_ID, MediaStore.Audio.Media.DURATION, MediaStore.Audio.Media.SIZE,
                MediaStore.Audio.Media.DATA, MediaStore.Audio.Media.DATE_ADDED, MediaStore.Audio.Media.YEAR, MediaStore.Audio.Media.TRACK, MediaStore.Audio.Media.MIME_TYPE
            };
            String sel = MediaStore.Audio.Media.DURATION + " >= 15000";
            try (Cursor c = getContext().getContentResolver().query(base, cols, sel, null, MediaStore.Audio.Media.TITLE + " COLLATE NOCASE")) {
                if (c != null) {
                    while (c.moveToNext()) {
                        long id = c.getLong(0);
                        JSObject s = new JSObject();
                        s.put("id", id);
                        s.put("name", c.getString(1));
                        s.put("title", c.getString(2));
                        s.put("artist", c.getString(3));
                        s.put("album", c.getString(4));
                        s.put("albumId", c.getLong(5));
                        s.put("duration", c.getLong(6));
                        s.put("size", c.getLong(7));
                        String path = c.getString(8);
                        s.put("path", path);
                        String folder = "";
                        if (path != null) { File p = new File(path).getParentFile(); if (p != null) folder = p.getName(); }
                        s.put("folder", folder);
                        s.put("date", c.getLong(9));
                        s.put("year", c.getInt(10));
                        s.put("track", c.getInt(11));
                        s.put("mime", c.getString(12));
                        s.put("uri", ContentUris.withAppendedId(base, id).toString());
                        arr.put(s);
                    }
                }
                JSObject r = new JSObject();
                r.put("songs", arr);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Scan failed: " + e.getMessage());
            }
        });
    }

    static Bitmap loadArt(android.content.Context ctx, long id, int px) {
        try {
            Uri u = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id);
            if (Build.VERSION.SDK_INT >= 29) return ctx.getContentResolver().loadThumbnail(u, new Size(px, px), null);
            android.media.MediaMetadataRetriever mr = new android.media.MediaMetadataRetriever();
            mr.setDataSource(ctx, u);
            byte[] b = mr.getEmbeddedPicture();
            mr.release();
            if (b == null) return null;
            return android.graphics.BitmapFactory.decodeByteArray(b, 0, b.length);
        } catch (Exception e) {
            return null;
        }
    }

    @PluginMethod
    public void art(PluginCall call) {
        Long id = call.getLong("id");
        if (id == null) { call.reject("id missing"); return; }
        getBridge().execute(() -> {
            Bitmap bmp = loadArt(getContext(), id, 512);
            if (bmp == null) { call.reject("no art"); return; }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.JPEG, 82, out);
            JSObject r = new JSObject();
            r.put("data", "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
            call.resolve(r);
        });
    }

    /** title, artist, album, mediaId, playing, position (ms), duration (ms), rate */
    @PluginMethod
    public void update(PluginCall call) {
        Bundle b = new Bundle();
        JSObject d = call.getData();
        if (d.has("title")) b.putString("title", d.getString("title"));
        if (d.has("artist")) b.putString("artist", d.getString("artist"));
        if (d.has("album")) b.putString("album", d.getString("album"));
        if (d.has("mediaId")) b.putLong("mediaId", d.optLong("mediaId", 0));
        if (d.has("playing")) b.putBoolean("playing", d.optBoolean("playing", false));
        if (d.has("position")) b.putLong("position", d.optLong("position", 0));
        if (d.has("duration")) b.putLong("duration", d.optLong("duration", 0));
        if (d.has("rate")) b.putFloat("rate", (float) d.optDouble("rate", 1));
        PlaybackService.update(getContext(), b);
        call.resolve();
    }

    static void emit(String action, long pos) {
        if (inst == null) return;
        JSObject d = new JSObject();
        d.put("action", action);
        d.put("pos", pos);
        inst.notifyListeners("action", d, true);
    }
}
