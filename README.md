# M3U8-Time-Parser

Takes a live M3U8 stream and gets the current stream time. The system uses AJAX, and is designed to use minimal bandwidth in use. It supports both a callback method and fires an event when the time is updated so you can do as you will with the information.

## Usage

Include the JS file in your application (with jQuery), then simply pass a configuration using the following format into the function.

```
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
<script type="text/javascript" src="./parser.js"></script>
<script type="text/javascript">
    fetchStreamDatetime({
        'manifestUrl': '',
        'fragmentLength': 2,
        'callback': callbackExample,
        'pollingDelay': 20000
    });
</script>
```

Then, you can process the output Date object either by using the callback you have declared, or by catching the event that is fired.

```
<script type="text/javascript">
    $(document).on("streamDatetime", function(event, date) {
        console.log("Event handler example " + date);
    });

    function callbackExample(date) {
        console.log("Callback example" + date);
        $('#date-header-value').html(date);
    }
</script>
```

The callback and event are both triggered together (lines 135 and 138). They are triggered every-time the Date() object changes, normally once per second. 

## How does it work?

The JavaScript will fetch the given URL and parse it to find the location of the audio stream. It will use this as it is the most likely to be present. Once it has the audio layer it will parse it for the *last* `datetime` in the file, and then add the correct time for all fragments after the `datetime` onto this based on the given fragment length. Once this is done, the script stores the final index of the file in a variable, and on the next poll only gets the latest additions to the file (using the Range header, so make sure this is allowed on your server) saving bandwidth and time. It will then parse the new fragments and add them onto the existing datetime.

To further save bandwidth the polling interval can be set at a long value, such as 20-seconds, and the script fill-in the time between each poll, simply using the polls to ensure it stays in-sync with the stream.

## License

This is MIT licensed, see the included file. Written by [Daniel Groves](http://danielgroves.net) for [Vualto Ltd.](http://vualto.com)
