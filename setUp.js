var request=require('request'),
    cheerio = require('cheerio'),
    fs = require('fs');

var defaultLink = [
  'http://www.walmart.com/'
  ],
  inputArray= "";

send = (options)=> {
  return new Promise(function (resolve, reject){
      request(options, function (err, res, body) {
        if (err)
          return reject(err)
        if (res.statusCode >= 400) {
          return reject(body);
        }
        return resolve({
          html: body,
          item: options.url
        });
      })
  });
};

fetchCategory = (item)=> {
  var options = {
    url : item,
    headers : {"User-Agent" : "Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/50.0.2661.102 Chrome/50.0.2661.102 Safari/537.36"}
  };
  return send(options)
}

const noop = ()=>{}
function initialSetup(callback) {

  promisesToFetchCateg = defaultLink.map(function(item) {
    console.log("fetching initialSetup item - ", item);
    return fetchCategory(item)
  })

  const processHtmlDataList = (htmlDataList) => {
    console.log("processing initialSetup htmlDataList");
    htmlDataList.forEach((htmlData) => {
        var $ = cheerio.load(htmlData.html);
        $('li').filter(function() {
          if(($(this).text().length>0)&&($(this).text().length<100)) {
            return true;
          } else {
            return false;
          }
        }).each(function() {
          var newList = $(this).text().toLowerCase().replace(/\s\s/g,"");
          if(inputArray.indexOf(newList) === -1){
            inputArray += newList.replace(/[a-zA-Z]/g,"") + "";
          }
        })
      })
      return Promise.resolve(0)
    }

  console.log("Before promise all");
  return Promise.all(promisesToFetchCateg)
  .then(processHtmlDataList)
  .then(()=>{
    console.log("entering website check...");
    webSiteCheck(0.5);
  })
  .catch((err)=> console.log("data error", err))
}

initialSetup();
