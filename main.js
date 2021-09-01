const Twit = require("twit");
const dotenv = require("dotenv");
const tokens = require("./tokens.json");
var tvd = require('twitter-video-downloader');
const youtubedl = require('youtube-dl-exec');
const fs = require("fs");
const { nanoid } = require("nanoid");
const readline = require('readline');
const axios = require("axios");

const BitlyClient = require('bitly').BitlyClient;
const bitly = new BitlyClient('17c1efff96bfe6bd880e21886a035bfe673b486d');

dotenv.config();

const downloader = new Twit({

    consumer_key: process.env.CONSUMER_KEY,

    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,

    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000
});

var stream = downloader.stream('statuses/filter', { track: ['@baixesaporra'] });
stream.on('tweet', tweetEvent);

console.log("")
console.log("ESPERANDO TWEETS...")
console.log("")

async function tweetEvent(tweet) {
  console.log("")
  console.log(tweet)
  console.log("")

  var tweet_owner_screenname = tweet.in_reply_to_screen_name
  var tweet_reply_id = tweet.in_reply_to_status_id_str
  var tweet_id = tweet.id_str;
  var user_screen_name = tweet.user.screen_name

  var replying_url = `https://twitter.com/${tweet_owner_screenname}/status/${tweet_reply_id}`

  console.log("")
  console.log(`Tweet url: ${replying_url}`)
  console.log("")

  const subprocess = youtubedl.raw(replying_url, { dumpSingleJson: true });
  
  console.log(`Running subprocess as ${subprocess.pid}`);
  
  subprocess.stdout.pipe(fs.createWriteStream('output.json'));

  subprocess.stdout.on('end', function () {
    var stream = fs.createReadStream("./output.json", {flags: 'r', encoding: 'utf-8'});
    var buf = '';
    
    stream.on('data', function(d) {
        buf += d.toString(); // when data is read, stash it in a string buffer
        pump(); // then process the buffer
    });
    
    function pump() {
        var pos;
    
        while ((pos = buf.indexOf('\n')) >= 0) { // keep going while there's a newline somewhere in the buffer
            if (pos == 0) { // if there's more than one newline in a row, the buffer will now start with a newline
                buf = buf.slice(1); // discard it
                continue; // so that the next iteration will start with data
            }
            processLine(buf.slice(0,pos)); // hand off the line
            buf = buf.slice(pos+1); // and slice the processed data off the buffer
        }
    }
    
    async function processLine(line) { // here's where we do something with a line
    
        if (line[line.length-1] == '\r') line=line.substr(0,line.length-1); // discard CR (0x0D)
    
        if (line.length > 0) { // ignore empty lines
          var obj = JSON.parse(line); // parse the JSON

          console.log(obj)

          protocols = [];
          var final_link;

          obj.formats.forEach(format => {
            if(format.protocol == "https") {
              protocols.push(format.url)
            }
            else return false;
          })

          reply = async function(video) {

            const response = await bitly.shorten(video);
            var link = response.link;

            var res = {
              status: `Baixei, saporra, @${tweet.user.screen_name}, segue pra dar aquela moral, vai` + `\n${link}`,
              in_reply_to_status_id: '' + tweet_id
            };
          
            downloader.post('statuses/update', res,
              function(err, data, response) {
                console.log(data);
              }
            );
          }

          reply(protocols[0]);
        }
    }
  });
};

// downloader.post('media/upload', { media_data: videoReadableBufferStream }, function (err, data, response) {
//     // now we can assign alt text to the media, for use by screen readers and
//     // other text-based presentations and interpreters
//     var mediaIdStr = data.media_id_string
//     var altText = "Vídeo baixado com sucesso"
//     var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

//     downloader.post('media/metadata/create', meta_params, function (err, data, response) {
//       if (!err) {
//         // now we can reference the media and post a tweet (media will attach to the tweet)
//         var params = { status: `@${user_screen_name} aqui está seu vídeo baixado`, media_ids: [mediaIdStr] }

//         downloader.post('statuses/update', params, function (err, data, response) {
//           console.log(data)
//         })
//       }
//     })
// })