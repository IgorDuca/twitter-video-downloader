const Twit = require("twit");
const dotenv = require("dotenv");
const tokens = require("./tokens.json");
const youtubedl = require('youtube-dl-exec');
const fs = require("fs");
const axios = require("axios");
const express = require("express");
const cors = require("cors");

const BitlyClient = require('bitly').BitlyClient;
const { pid } = require("process");
const bitly = new BitlyClient('4a1bb91b0d68df47e685eea12815ebeb48dd445a');

dotenv.config();

var app = express();
app.use(cors());
app.use('/', express.static(__dirname + '/public'));

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

  let portID = 1238 || process.env.PORT;
  
  var stream = downloader.stream('statuses/filter', { track: ['@baixesaporra'] });
  stream.on('tweet', tweetEvent);
  
  console.log("")
  console.log("ESPERANDO TWEETS...")
  console.log("")
  
  async function tweetEvent(tweet) {
    console.log("")
    console.log(tweet)
    console.log("")
  
    var tweet_owner_screenname = tweet.in_reply_to_screen_name;
    var tweet_reply_id = tweet.in_reply_to_status_id_str;

    if(tweet_reply_id == null) {
      var text = tweet.text;
      var split = text.split(' ');
      var link = split[1];

      const subprocess = youtubedl.raw(link, { dumpSingleJson: true }, { pid: portID });
    
      console.log(`Running subprocess as ${subprocess.pid}`);
      
      subprocess.stdout.pipe(fs.createWriteStream('output.json'));
      subprocess.stderr.pipe(fs.createWriteStream('error.txt'));

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
              YouTubeProcessLine(buf.slice(0,pos)); // hand off the line
              buf = buf.slice(pos+1); // and slice the processed data off the buffer
          }
        }

        async function YouTubeProcessLine(line) {
          if (line[line.length-1] == '\r') line=line.substr(0,line.length-1); // discard CR (0x0D)
    
          if (line.length > 0) {
            var obj = JSON.parse(line); // parse the JSON

            console.log(obj)

            protocols = [];

            obj.formats.forEach(format => {
              if(format.protocol == "https") {

                var resolution = `(${format.height}x${format.width})`;

                if(resolution == "(undefinedxundefined)") resolution = ""

                var pushData = {
                  url: format.url,
                  resolution: resolution
                }

                console.log(pushData);

                protocols.push(pushData);
              }
              else return false;
            })

            async function shortenYoutubeUrl(link) {
              const response = await bitly.shorten(link).catch(error => {
                console.log(error)
              });
              return response.link;
            }

            YoutubeReply = async function(link) {
              downloader.get('followers/ids', { screen_name: 'baixesaporra' },  function (err, data, response) {
                var ids = data.ids;

                console.log("")
                console.log(ids)
                console.log("")

                var id_list = [];

                ids.forEach(id => {
                  id_list.push(id);
                });

                var id_in_list = id_list.includes(tweet.user.id)

                if(id_in_list == true) {
                  var res = {
                    status: `Baixei, @${tweet.user.screen_name}, você pode usar qualquer um desses links pra baixar seu vídeo: ` + `\n${link}`,
                    in_reply_to_status_id: '' + tweet_id
                  };
                
                  downloader.post('statuses/update', res,
                    function(err, data, response) {
                      console.log(data);
                    }
                  );
                }
                else {
                  var res = {
                    status: `Ei, patrão, @${tweet.user.screen_name}, você precisa me seguir pra eu te ajudar, então me siga, apague esse tweet e me marque na publicação novamente 😁`,
                    in_reply_to_status_id: '' + tweet_id
                  };
                
                  downloader.post('statuses/update', res,
                    function(err, data, response) {
                      console.log(data);
                    }
                  );
                }

                downloader.post('statuses/update', res,
                  function(err, data, response) {
                    console.log(data);
                  }
                );

              })
            }

            async function posting_yt_results(urls) {
              console.log("")
              console.log("URLS")
              console.log(urls)
              console.log("")
  
              var string_list = [];
  
              function add_selected_link() {
                var link = urls[Math.floor(Math.random()*urls.length)];
                string_list.push(`${link.shortenUrl} ${link.resolution}`)
              }
  
              for (var i = 1; i < 5; i++) add_selected_link(i);
  
              var url_string = string_list.join("\n");
  
              YoutubeReply(url_string);
            }
  
            async function youtube_protocol_shortening() {
  
              var urls = [];
  
              var length = protocols.length;
  
              protocols.forEach(async protocol => {
                var url = await shortenYoutubeUrl(protocol.url);
                urls.push({
                  shortenUrl: url,
                  resolution: `${protocol.resolution}`
                });
                console.log("")
                console.log(url)
                console.log(`Total de urls: ${urls.length}/${protocols.length}`)
                console.log("")
  
                if(urls.length === length) {
                  posting_yt_results(urls);
                }
              })
            }
  
            youtube_protocol_shortening();
          }
        }
      })
    }

    var tweet_id = tweet.id_str;

    if(tweet.in_reply_to_screen_name == "baixesaporra") return false;
  
    var replying_url = `https://twitter.com/${tweet_owner_screenname}/status/${tweet_reply_id}`
  
    console.log("")
    console.log(`Tweet url: ${replying_url}`)
    console.log("")
  
    const subprocess = youtubedl.raw(replying_url, { dumpSingleJson: true }, { pid: portID });
    
    console.log(`Running subprocess as ${subprocess.pid}`);
    
    subprocess.stdout.pipe(fs.createWriteStream('output.json'));
    subprocess.stderr.pipe(fs.createWriteStream('error.txt'));
  
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

              var resolution = `(${format.height}x${format.width})`;

              if(resolution == "(undefinedxundefined)") resolution = ""

              var pushData = {
                url: format.url,
                resolution: resolution
              }

              console.log(pushData);

              protocols.push(pushData);
            }
            else return false;
          })

          async function shortenUrl(link) {
            const response = await bitly.shorten(link).catch(error => {
              console.log(error);
            });
            return response.link;
          }

          reply = async function(link) {

            downloader.get('followers/ids', { screen_name: 'baixesaporra' },  function (err, data, response) {
              var ids = data.ids;

              console.log("")
              console.log(ids)
              console.log("")

              var id_list = [];

              ids.forEach(id => {
                id_list.push(id);
              });

              var id_in_list = id_list.includes(tweet.user.id)

              if(id_in_list == true) {
                var res = {
                  status: `Baixei, @${tweet.user.screen_name}, você pode usar qualquer um desses links pra baixar seu vídeo: ` + `\n${link}`,
                  in_reply_to_status_id: '' + tweet_id
                };
              
                downloader.post('statuses/update', res,
                  function(err, data, response) {
                    console.log(data);
                  }
                );
              }
              else {
                var res = {
                  status: `Ei, patrão, @${tweet.user.screen_name}, você precisa me seguir pra eu te ajudar, então me siga, apague esse tweet e me marque na publicação novamente 😁`,
                  in_reply_to_status_id: '' + tweet_id
                };
              
                downloader.post('statuses/update', res,
                  function(err, data, response) {
                    console.log(data);
                  }
                );
              }
            })
          }

          async function posting_results(urls) {

            console.log("")
            console.log("URLS")
            console.log(urls)
            console.log("")

            var string_list = [];

            urls.forEach(url => [
              string_list.push(`${url.shortenUrl} ${url.resolution}`)
            ])

            var url_string = string_list.join("\n");

            reply(url_string);
          }

          async function protocol_shortening() {

            var urls = [];

            var length = protocols.length;

            protocols.forEach(async protocol => {
              var url = await shortenUrl(protocol.url);
              urls.push({
                shortenUrl: url,
                resolution: `${protocol.resolution}`
              });
              console.log("")
              console.log(url)
              console.log(`Total de urls: ${urls.length}/${protocols.length}`)
              console.log("")

              if(urls.length === length) {
                posting_results(urls);
              }
            })
          }

          protocol_shortening();
        }
    }
    });
  };
});

app.get("/", (req, res) => {
  res.send("TWITTER DOWNLOADER")
});

app.get("/example", (req, res) => {
  res.send("aksjdakd")
});