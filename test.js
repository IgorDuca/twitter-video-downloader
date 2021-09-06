const youtubedl = require('youtube-dl-exec');

youtubedl('https://t.co/5P2NaQBZhu')
  .then(output => console.log(output))