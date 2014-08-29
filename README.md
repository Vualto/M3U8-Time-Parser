# M3U8-Time-Parser

Takes a live M3U8 stream and gets the current stream time. The system uses AJAX, and is designed to use minimal bandwidth in use. It supports both a callback method and fires an event when the time is updated so you can do as you will with the information.

## Usage

Include the JS file into you application, and remove the example callback and event handler. Then, simple pass a configuration using the following format into the function.

```
var options = {
  'manifest_url': 'http://example.com/manifest.m3u8',
  'fragment_length': 2,
  'callback': callback_example,
  'polling_delay': 20000
};
fetch_stream_datetime(options);
```

## How does it work?

The JavaScript will fetch the given URL and parse it to find the location of the audio stream. It will use this as it is the most likely to be present. Once it has the audio layer it will parse it for the *last* `datetime` in the file, and then add the correct time for all fragments after the `datetime` onto this based on the given fragment length. Once this is done, the script stores the final index of the file in a variable, and on the next poll only gets the latest additions to the file (using the Range header, so make sure this is allowed on your server) saving bandwidth and time. It will then parse the new fragments and add them onto the existing datetime.

To further save bandwidth the polling interval can be set at a long value, such as 20-seconds, and the script fill-in the time between each poll, simply using the polls to ensure it stays in-sync with the stream.

## License

This is MIT licensed, see the included file. Written by [Daniel Groves](http://danielgroves.net) for [Vualto Ltd.](http://vualto.com)
