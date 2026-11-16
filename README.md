# SP03 – Music Player (Prototype)

Live: https://sandeep-1407.github.io/sp03-music/

Har format ka music, screen band hone par bhi chalta hai. Kuch upload nahi hota.

## Gaane kaise judte hain
- **🎵 Gaane jodein** → gaane chunein (ek saath saare) → app poochhega:
  - **💾 Library mein save karein**: gaane app mein copy ho jaate hain, band karke kholne par bhi rehte hain. Phone mein utni jagah lagti hai.
  - **▶ Abhi bas chalayein**: sirf is baar chalenge, koi jagah nahi lagti.
- **PC**: 📁 Folder jodein → poora folder (andar ke folder bhi) padh liya jata hai, copy nahi hota. Settings → "PC folder dobara padhein" se naye gaane aa jaate hain.
- Mobile: Gallery/File manager se **Share → SP03**. PC: **Open with → SP03**.
- Gaane ke saath same naam ki **.lrc** file chunein to lyrics apne aap jud jaate hain.

## Features
| | |
|---|---|
| Library | Songs, Albums, Artists, Playlists, Genres, Folders · Search · Sort (A–Z, Artist, Naye, Zyada sune) |
| Gaane ki jaankari | Naam, artist, album, genre, saal, track no., album photo, lyrics — gaane ke andar se padhta hai (MP3, M4A, FLAC, OGG, OPUS, WMA) |
| Background | Screen band hone par bhi chalta hai · Lock screen/notification pe photo, Play/Pause/Next/Prev, seek · Headphone buttons |
| Playback | Shuffle, Repeat (sab/ek), Crossfade 2–12s, Gapless (agla gaana pehle se taiyaar), Speed 0.5x–2x, A-B repeat, Resume |
| Sound | 10-band equalizer + 12 presets (Bollywood, Bass, Pop, Rock, Classical, Jazz, Vocal, Hip-Hop, Electronic, Treble, Headphones), Bass boost, 3D surround, Balance, Volume boost 200%, Volume leveler |
| Lyrics | LRC synced lyrics (chal rahi line highlight, line pe tap = wahan jaayein), saade lyrics bhi |
| Playlists | Banana, naam badalna, order, hatana · Smart: Pasandida ❤, Haal mein sune, Sabse zyada sune, Haal mein jode |
| Queue | Iske baad chalayein, Queue mein jodein, order badlein, hatayein |
| Aur | Sleep timer (5–120 min ya gaana khatm hone par, aakhri 20s mein aawaz dheere kam), Visualizer, Song info, Share, Library se hatana |
| Formats | MP3, M4A/AAC, FLAC, WAV, OGG, OPUS seedha · WMA, AMR, AC3, APE aadi ek baar phone mein badal kar (save kiye gaane dobara nahi badalte) |
| PC keys | Space play/pause · ←/→ 5s · Shift+←/→ pichla/agla · L lyrics · S shuffle · R repeat |

## Test (Chrome, 15 Nov 2026)
8 formats import ✔ · Tags + album photo ✔ · LRC lyrics sync ✔ · Next/Shuffle ✔ · EQ preset ✔ · WMA badal kar chala (1.7s) ✔ · Crossfade 4s ✔ · Gapless next ✔ · Playlist ✔ · Reload ke baad library + resume ✔ · Lock screen info ✔

## Abhi ki limits
- Android pe app phone ka music folder khud scan nahi kar sakta — gaane ek baar chunne padte hain (native version mein auto-scan).
- "Pitch" alag se nahi badalta; switch on karne par speed ke saath sur badalta hai.
- Online lyrics/album photo search nahi hai (sirf gaane ke andar ya .lrc file se).
- Pehli baar WMA/AMR jaise format ke liye converter (~31 MB) internet se aata hai.

## 📲 Android app (APK)
https://github.com/Sandeep-1407/sp03-music/releases/latest/download/SP03-Music.apk
- Phone ke **saare gaane apne aap** dikhte hain (Songs / Albums / Artists / Folders) – kuch jodna nahi padta
- Screen band ya app peeche hone par bhi gaana chalta rehta hai; notification aur lock screen par ⏮ ⏯ ⏭ buttons
- Headphone nikalte hi gaana ruk jata hai
- GitHub Actions (`.github/workflows/android.yml`) se banta hai: Capacitor 7 + `MusicNativePlugin.java` + `PlaybackService.java`

---
Created by - Sandeep Kumar from Sandeep Jan Seva Kendra, Mob no. 8299430081