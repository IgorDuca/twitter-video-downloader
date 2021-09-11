const Twit = require("twit");
const dotenv = require("dotenv");
const tokens = require("./tokens.json");
const youtubedl = require('youtube-dl-exec');
const fs = require("fs");
const axios = require("axios");
const express = require("express");
const cors = require("cors");
var engines = require('consolidate');

var requests = require("./data/requests.json");

const BitlyClient = require('bitly').BitlyClient;
const { pid } = require("process");
const bitly = new BitlyClient('4a1bb91b0d68df47e685eea12815ebeb48dd445a');

dotenv.config();

var app = express();
app.use(cors());

var PORT = 1239 || process.env.PORT;

var bot_username = "wluvigor";

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
  
  var stream = downloader.stream('statuses/filter', { track: [`@${bot_username}`] });
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
    var tweet_id = tweet.id_str;

    if(tweet_reply_id != null) {
      console.log("");
      console.log("INCIANDO PROCESSO DE VÍDEO PADRÃO");
      console.log("");
    }

    async function processLine(line) {
      if (line[line.length-1] == '\r') line=line.substr(0,line.length-1);

      if (line.length > 0) {
        var obj = JSON.parse(line);

        console.log("");
        console.log(obj);
        console.log("");

        var protocols  = [];

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

            protocol_shortning();
          }
          else return false;
        });

        async function shortUrl(link) {
          const response = await bitly.shorten(link).catch(error => {
            console.log(error)
          });
          return response.link;
        };

        async function protocol_shortning() {
          var urls = [];

          var length = protocols.length;

          if(length > 5) {
            function add_selected_link() {
              var link = urls[Math.floor(Math.random()*urls.length)];

              console.log("");
              console.log("LINK");
              console.log(link);
              console.log("");

              urls.push({
                shortenUrl: link.shortenUrl,
                resolution: link.resolution
              });
            }

            for (var i = 1; i < 5; i++) add_selected_link(i);

            // adding_json_data(urls);
          }
          else {
            protocols.forEach(async protocol => {
              var url = await shortUrl(protocol.url);
              urls.push({
                shortenUrl: url,
                resolution: `${protocol.resolution}`
              });
              console.log("")
              console.log(url)
              console.log(`Total de urls: ${urls.length}/${protocols.length}`)
              console.log("")

              if(urls.length === length) {
                adding_json_data(urls);
              }
            })
          }
        }

        async function adding_json_data(urls){
          console.log("")
          console.log("URLS")
          console.log(urls)
          console.log("")

          if(!requests[tweet.id]) {
            requests[tweet.id] = {
              urls: urls
            }
          }
          else {
            requests[tweet.id] = {
              urls: urls
            }
          }

          console.log("");
          console.log("REQUEST");
          console.log(requests[tweet_id]);
          console.log("");

          fs.writeFile('./data/requests.json', JSON.stringify((requests), null, 4), function() {
            console.log("Urls adicionados...")
          });

          var base_url = `https://baixesaporra.netlify.app/urls/${tweet_id}`;

          var finalUrl = await shortUrl(base_url);
          reply(finalUrl);
        }

        reply = async function(link) {
          downloader.get('followers/ids', { screen_name: bot_username },  function (err, data, response) {
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
                status: `Baixei, @${tweet.user.screen_name}, usa esse link aqui pra baixar seu vídeo: ${link}`,
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
          });
        }
      }
    }

    if(tweet_reply_id != null) {
      var text = tweet.text;
      var split = text.split(' ');

      var link = `https://twitter.com/${tweet_owner_screenname}/status/${tweet_reply_id}`

      console.log("");
      console.log(`LINK: ${link}`);
      console.log("");

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
      
          while ((pos = buf.indexOf('\n')) >= 0) {
              if (pos == 0) {
                  buf = buf.slice(1);
                  continue;
              }
              processLine(buf.slice(0,pos));
              buf = buf.slice(pos+1);
          }
        }
      });
    }
    // if(tweet_reply_id == null) {

      // var text = tweet.text;
      // var split = text.split(`@${bot_username}`);

      // var link = split[1];
      // link = link.trim();

      // console.log("");
      // console.log(`LINK: ${link}`);
      // console.log("");

      // const subprocess = youtubedl.raw(link, { dumpSingleJson: true }, { pid: portID });
    
      // console.log(`Running subprocess as ${subprocess.pid}`);
      
      // subprocess.stdout.pipe(fs.createWriteStream('output.json'));
      // subprocess.stderr.pipe(fs.createWriteStream('error.txt'));

      // subprocess.stdout.on('end', function () {
      //   var stream = fs.createReadStream("./output.json", {flags: 'r', encoding: 'utf-8'});
      //   var buf = '';
        
      //   stream.on('data', function(d) {
      //       buf += d.toString(); // when data is read, stash it in a string buffer
      //       pump(); // then process the buffer
      //   });

      //   function pump() {
      //     var pos;
      
      //     while ((pos = buf.indexOf('\n')) >= 0) {
      //         if (pos == 0) {
      //             buf = buf.slice(1);
      //             continue;
      //         }
      //         processLine(buf.slice(0,pos));
      //         buf = buf.slice(pos+1);
      //     }
      //   }
      // });
    // }
  }
});

app.get("/", (req, res) => {
  res.send("TWITTER DOWNLOADER")
});

app.get("/urls/:id", (req, res) => {
  var id = req.params.id;

  res.json(requests[id]);
});