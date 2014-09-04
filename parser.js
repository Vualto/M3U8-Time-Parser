function fetchStreamDatetime(options) {
    var opts = $.extend({
        'manifestUrl': null,
        'callback': null,
        'fragmentLength': 2,
        'pollingDelay': 10000
    }, options);

    var state = {
        'index': 0,
        'datetime': 0
    };

    window.console && console.debug("Manifest url: " + opts.manifestUrl);
    $.ajax({
        url: opts.manifestUrl,
        success: processManifest,
        error: ajaxError
    });

    function processManifest(data, textStatus, jqXHR) {
        window.console && console.log("Loaded manifest file");

        indexOfSlash = opts.manifestUrl.lastIndexOf('/') + 1;
        audioFile = data.match(/^[a-z]+-audio=\d*\.m3u8/m);
        var url = opts.manifestUrl.substring(0, indexOfSlash) + audioFile;
        window.console && console.debug("Audio file url: " + url);

        audioUrl = url;
        fetchInitialAudio(url);
    }

    function fetchInitialAudio(url) {
        $.ajax({
            url: url,
            success: processAudio
        });
        window.setTimeout(fetchAudioFragment, opts.pollingDelay, [url]);
    }

    function fetchAudioFragment(url) {
        rangeHeader = 'bytes=' + state.index + '-' + (state.index + 50000);
        window.console && console.debug('Range Header Value: ' + rangeHeader);

        $.ajax({
            url: url,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Range', rangeHeader);
            },
            success: processAudioFragment,
            error: ajaxError
        });
        window.setTimeout(fetchAudioFragment, opts.pollingDelay, [url]);
    }

    function interimEvents() {
        var currentDatetime = state.datetime;
        var loops = opts.pollingDelay / 1000;

        for (var i = 0; i < loops; i++) {
            window.setTimeout(notify, 1000 * i, [currentDatetime + (1000 * i)]);
        }
    }

    function processAudio(data, textStatus, jqXHR) {
        var start = performance.now();

        window.console && console.log("Loaded audio file");

        // Parse the datestamp
        var datestamps = data.match(/#EXT-X-PROGRAM-DATE-TIME:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{6})?Z/gm);
        var datestamp = datestamps[datestamps.length - 1];
        window.console && console.debug(datestamps.length + ' datestamps found');
        window.console && console.debug('The last datestamp is "' + datestamp + '"');

        state.datetime = datetimeParser(datestamp);

        // Get rid of the uneeded part of the stream
        var datestampIndex = data.indexOf(datestamp);
        window.console && console.debug('The datestamp index is ' + datestampIndex);
        var cleanedData = data.substring(datestampIndex, data.length);

        // Handle stream fragments
        processAudioFragment(cleanedData, data.length);

        // Cleanup
        var executionTime = performance.now() - start;
        window.console && console.debug('All Audio data parsed in: ' + executionTime + ' milliseconds');
    }

    function processAudioFragment(data, originalLength) {
        var start = performance.now();

        window.console && console.debug('The starting datetime is: ' + state.datetime);
        var fragments = data.match(/=\d*-\d*.ts/gm);
        var additionalSeconds = fragments.length * opts.fragmentLength;
        state.datetime += (additionalSeconds * 1000);
        window.console && console.debug('Adding ' + additionalSeconds + ' seconds');
        window.console && console.info('Final Date is: ' + state.datetime);

        if (typeof(originalLength) == "number")
            state.index = originalLength;
        else
            state.index += data.length;

        window.console && console.debug('Current index: ' + state.index);

        notify(state.datetime);
        interimEvents();

        var end = performance.now() - start;
        window.console && console.debug('Audio fragment data parsed in ' + end + ' milliseconds');
    }

    function datetimeParser(datestamp) {
        datestamp = datestamp.replace('#EXT-X-PROGRAM-DATE-TIME:', '');

        var year = datestamp.substring(0, 4);
        var month = datestamp.substring(5, 7) - 1;
        var day = datestamp.substring(8, 10);

        var hours = datestamp.substring(11, 13);
        var minutes = datestamp.substring(14, 16);
        var seconds = datestamp.substring(17, 19);
        var milliseconds = datestamp.substring(20, 23);

        datestamp = Date.UTC(year, month, day, hours, minutes, seconds, milliseconds);

        return datestamp;
    }

    function notify(datetime) {
        datetime = new Date(parseInt(datetime));

        $(document).trigger("streamDatetime", [datetime]);

        if(typeof(opts.callback) == "function")
            opts.callback(datetime);
    }

    function ajaxError(jqXHR, textStatus, errorThrown) {
        window.console && console.error('Failed to load ' + this.url);
    }
}
