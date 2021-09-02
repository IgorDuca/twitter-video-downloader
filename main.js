const Twit = require("twit");
const dotenv = require("dotenv");
const tokens = require("./tokens.json");
var tvd = require('twitter-video-downloader');
const youtubedl = require('youtube-dl-exec');
const fs = require("fs");
const { nanoid } = require("nanoid");
const readline = require('readline');
const axios = require("axios");
const express = require("express");
const cors = require("cors");

const BitlyClient = require('bitly').BitlyClient;
const { pid } = require("process");
const bitly = new BitlyClient('17c1efff96bfe6bd880e21886a035bfe673b486d');

dotenv.config();

var app = express();
app.use(cors());

var PORT = 1239 || process.env.PORT;

app.listen(PORT, () => {
  console.log(`Working at: http://localhost:${PORT}`)

  const downloader = new Twit({
    consumer_key: tokens.CONSUMER_KEY,

    consumer_secret: tokens.CONSUMER_SECRET,
    access_token: tokens.ACCESS_TOKEN,

    access_token_secret: tokens.ACCESS_TOKEN_SECRET,
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

    let portID = 1238 || process.env.PORT;

    const subprocess = youtubedl.raw(replying_url, { dumpSingleJson: true }, { pid: portID });
    
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
})

app.get("/", (req, res) => {
  res.send("TWITTER BOT")
})