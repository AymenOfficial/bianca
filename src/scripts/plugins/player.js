/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function(playlist , win) {
    this.playlist = playlist;
    this.index = 0;
    this.track = win["track"];
    this.timer = win["timer"];
    this.duration = win["duration"];
    this.playBtn = win["playBtn"];
    this.pauseBtn = win["pauseBtn"];
    this.volumeBtn = win["volumeBtn"];
    this.progress = win["progress"];
    this.volumi = win["volume"];
    this.range = win["range"];
    this.volume(current_volume);

};

Player.prototype = {

    /**
     * Play a song in the playlist.
     * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
     */
    play: function(index) {
        var self = this;
        var sound;

        index = typeof index === 'number' ? index : self.index;
        var data = self.playlist[index];

        // If we already loaded this track, use the current one.
        // Otherwise, setup and load a new Howl.
        if (data.howl) {
            sound = data.howl;
        } else {
            sound = data.howl = new Howl({
                src: [ './assets/audio/' + data.file + '.mp3'],
                html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
                onplay: function() {
                    // Display the duration.
                    self.duration.innerHTML = self.formatTime(Math.round(sound.duration()));

                    // Start upating the progress of the track.
                    requestAnimationFrame(self.step.bind(self));

                    self.pauseBtn.style.display = 'inline-block';
                    self.playBtn.style.display = 'none';
                },
                onend: function() {
                    self.skip('right');
                }
            });
        }

        // Begin playing the sound.
        sound.play();

        // Show the pause button.
        if (sound.state() === 'loaded') {
            self.playBtn.style.display = 'none';
            self.pauseBtn.style.display = 'inline-block';
        } else {
            self.playBtn.style.display = 'none';
            self.pauseBtn.style.display = 'none';
        }

        // Keep track of the index we are currently playing.
        self.index = index;
    },

    /**
     * Pause the currently playing track.
     */
    pause: function() {
        var self = this;

        // Get the Howl we want to manipulate.
        var sound = self.playlist[self.index].howl;

        // Puase the sound.
        sound.pause();

        // Show the play button.
        self.playBtn.style.display = 'inline-block';
        self.pauseBtn.style.display = 'none';
    },

    /**
     * Skip to the next or previous track.
     * @param  {String} direction 'next' or 'prev'.
     */
    skip: function(direction) {
        var self = this;

        // Get the next track based on the direction of the track.
        var index = 0;
        if (direction === 'prev') {
            index = self.index - 1;
            if (index < 0) {
                index = self.playlist.length - 1;
            }
        } else {
            index = self.index + 1;
            if (index >= self.playlist.length) {
                index = 0;
                return;
            }
        }
        playingAudio["index"] = index + 1;
        setPlayingAudioWidth();
        self.skipTo(index);
    },

    /**
     * Skip to a specific track based on its playlist index.
     * @param  {Number} index Index in the playlist.
     */
    skipTo: function(index) {
        var self = this;

        // Stop the current track.
        if (self.playlist[self.index].howl) {
            self.playlist[self.index].howl.stop();
        }

        // Reset progress.
        self.progress.style.width = '0%';

        // Play the new track.
        self.play(index);
    },

    /**
     * Set the volume and update the volume slider display.
     * @param  {Number} val Volume between 0 and 1.
     */
    volume: function(val) {
        var self = this;

        // Update the global volume (affecting all Howls).
        Howler.volume(val);
        current_volume = val;

        // Update the display on the slider.
        var barWidth = (val * 90) / 100;
        self.range.value = val * 100;
    },

    /**
     * Seek to a new position in the currently playing track.
     * @param  {Number} per Percentage through the song to skip.
     */
    seek: function(per) {
        var self = this;

        // Get the Howl we want to manipulate.
        var sound = self.playlist[self.index].howl;

        // Convert the percent into a seek position.
        if (sound.playing()) {
            sound.seek(sound.duration() * per);
        }
    },

    /**
     * The step called within requestAnimationFrame to update the playback position.
     */
    step: function() {
        var self = this;

        // Get the Howl we want to manipulate.
        var sound = self.playlist[self.index].howl;

        // Determine our current seek position.
        var seek = sound.seek() || 0;
        self.timer.innerHTML = self.formatTime(Math.round(seek));


        self.progress.style.width = (((seek / sound.duration()) * playingAudio["width"])  || 0) + '%';

        // If the sound is still playing, continue stepping.
        if (sound.playing()) {
            requestAnimationFrame(self.step.bind(self));
        }
    },
    /**
     * Format the time from seconds to M:SS.
     * @param  {Number} secs Seconds to format.
     * @return {String}      Formatted time.
     */
    formatTime: function(secs) {
        var minutes = Math.floor(secs / 60) || 0;
        var seconds = (secs - minutes * 60) || 0;

        return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }
};



