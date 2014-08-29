function fetch_stream_datetime(options) {
  var opts = $.extend({
    'manifest_url': null,
    'callback': null,
    'fragment_length': 2,
    'polling_delay': 10000
  }, options);

  var state = {
    'index': 0,
    'datetime': 0
  };

  window.console && console.debug("Manifest url: " + opts.manifest_url);
  $.ajax({
    url: opts.manifest_url,
    success: process_manifest,
    error: ajax_error
  });

  function process_manifest(data, textStatus, jqXHR) {
    window.console && console.log("Loaded manifest file");

    indexOfSlash = opts.manifest_url.lastIndexOf('/') + 1;
    audio_file = data.match(/^[a-z]+-audio=\d*\.m3u8/m);
    var url = opts.manifest_url.substring(0, indexOfSlash) + audio_file;
    window.console && console.debug("Audio file url: " + url);

    audio_url = url;
    fetch_initial_audio(url);
  }

  function fetch_initial_audio(url) {
    $.ajax({
      url: url,
      success: process_audio
    });
    window.setTimeout(fetch_audio_fragment, opts.polling_delay, [url]);
  }

  function fetch_audio_fragment(url) {
    range_header = 'bytes=' + state.index + '-' + (state.index + 50000);
    window.console && console.debug('Range Header Value: ' + range_header);

    $.ajax({
      url: url,
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Range', range_header);
      },
      success: process_audio_fragment,
      error: ajax_error
    });
    window.setTimeout(fetch_audio_fragment, opts.polling_delay, [url]);
  }

  function interim_events() {
    var current_datetime = state.datetime;
    var loops = opts.polling_delay / 1000;

    for (var i = 0; i < loops; i++) {
      window.setTimeout(notify, 1000 * i, [current_datetime + (1000 * i)]);
    }
  }

  function process_audio(data, textStatus, jqXHR) {
    var start = performance.now();

    window.console && console.log("Loaded audio file");

    // Parse the datestamp
    var datestamps = data.match(/#EXT-X-PROGRAM-DATE-TIME:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{6})?Z/gm);
    var datestamp = datestamps[datestamps.length - 1];
    window.console && console.debug(datestamps.length + ' datestamps found');
    window.console && console.debug('The last datestamp is "' + datestamp + '"');

    state.datetime = datetime_parser(datestamp);

    // Get rid of the uneeded part of the stream
    var datestamp_index = data.indexOf(datestamp);
    window.console && console.debug('The datestamp index is ' + datestamp_index);
    var cleaned_data = data.substring(datestamp_index, data.length);

    // Handle stream fragments
    process_audio_fragment(cleaned_data, data.length);

    // Cleanup
    var execution_time = performance.now() - start;
    window.console && console.debug('All Audio data parsed in: ' + execution_time + ' milliseconds');
  }

  function process_audio_fragment(data, original_length) {
    var start = performance.now();

    window.console && console.debug('The starting datetime is: ' + state.datetime);
    var fragments = data.match(/=\d*-\d*.ts/gm);
    var additional_seconds = fragments.length * opts.fragment_length;
    state.datetime += (additional_seconds * 1000);
    window.console && console.debug('Adding ' + additional_seconds + ' seconds');
    window.console && console.info('Final Date is: ' + state.datetime);

    if (typeof(original_length) == "number")
      state.index = original_length;
    else
      state.index += data.length;

    window.console && console.debug('Current index: ' + state.index);

    notify(state.datetime);
    interim_events();

    var end = performance.now() - start;
    window.console && console.debug('Audio fragment data parsed in ' + end + ' milliseconds');
  }

  function datetime_parser(datestamp) {
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

    $(document).trigger("stream_datetime", [datetime]);

    if(typeof(opts.callback) == "function")
      opts.callback(datetime);
  }

  function ajax_error(jqXHR, textStatus, errorThrown) {
    window.console && console.error('Failed to load ' + this.url);
  }
}

$(document).on("stream_datetime", function(event, date) {
  console.log("Event handler example " + date);
});
function callback_example(date) {
  console.log("Callback example" + date);
  $('#date-header-value').html(date);
}

var options = {
  'manifest_url': '',
  'fragment_length': 2,
  'callback': callback_example,
  'polling_delay': 20000
};
fetch_stream_datetime(options);
