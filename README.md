# Livestream Chat
Made for Discord chat clone for chatting while watching a live stream.

![LobbyPreview](https://cacheblasters.nyc3.cdn.digitaloceanspaces.com/LivestreamChatPreview_Lobby.png)
![ChatPreview](https://cacheblasters.nyc3.cdn.digitaloceanspaces.com/LivestreamChatPreview_Chat.png)


[Helpful Web Socket Tutorial](https://www.youtube.com/watch?v=vQjiN8Qgs3c&list=PL4cUxeGkcC9i4V-_ZVwLmOusj8YAUhj_9)

## Docker Compose

The included Docker Compose should have everything you need to get the livestream chat and the accompanying RTMP HLS server up and running.

### Environment Variables

#### CHAT_HOST

Host that the livestream chat should listen on

#### STREAM_HOST

Host of the RTMP HLS server; should point to the `rtmp` service from the docker compose file

#### LOBBY_TITLE (optional)

Title of the lobby page. Defaults to `Movie Lobby`.

#### CHAT_TITLE (optional)

Title of the chat page. Defaults to `Movie Lobby`.

#### POSTER_IMAGES (optional)

String of URLs to show for the thumbnail image before users play. If multiple are provided the delimter `;` should be used, for example
`POSTER_IMAGES=https://someImageHost.com/image.png;https://someImageHost.com/image2.png`.

If multiple are provided the image will be randomized on each page load.

## Streaming to the RTMP HLS server

The RTMP HLS server image used is from this repository:
https://github.com/TareqAlqutami/rtmp-hls-server

Any of their streaming recommendations should work for streaming to the RTMP HLS server.

### Stream Key

The stream key you provide to the RTMP HLS server should be used by users from the lobby page, or by navigating directly to your host, for example: https://YourLivestreamChatHost.com/someStreamKey

### Stream to the RTMP HLS server with FFMPEG

The following script FFMPEG script will also work for streaming tot he RTMP HLS server.

`ffmpeg -re -i yourFile.mkv -c:a aac -ar 44100 -ac 1 -vcodec copy -f flv rtmp://yourStreamingServer/live/someStreamKey`

### FFMPEG Paramters

`-re`: specifies that input will be read at its native framerate.

`-i`: "yourFile.mkv" specifies the path to your input file. The file should be encoded to h264

`-vcodec copy`: is set to copy, so no additional video encoding will occur.

`-c:a aac -ar 44100 -ac 1`: encodes audio to an RTMP-friendly format; aac is a widely supported audio codec, 44100 hz is a common frequency, and -ac 1 specifies the first version of the AAC spec for compatibility purposes.

`-f`: flv wraps the video in an flv format container for maximum compatibility with RTMP.

### FFMPEG Optional Parameters

`--filter_complex "subtitles=yourFile.mkv"`: if your source file contains subtitles, they can be included in the screen with this option.
