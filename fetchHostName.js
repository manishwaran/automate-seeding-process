var exec = require('child_process').exec;
var request=require('request'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    readlineSync = require('readline-sync');

var ipArray = [],hostName = [], fromIp='75.126.153.205', toIp = '75.126.153.250';

buildIpList = (fromIp, toIp) => {
  var tempIp = fromIp;
  while(tempIp !== toIp){
    ipArray.push(tempIp);
    var intIp = [];
    tempIp.split('.').map((val) => intIp.push(val));
    var i=3,flag = 1;
    while( flag && i>=0 ){
      intIp[i]++;
      if(intIp[i] / 256 == 1 ){
        flag = 1;
        intIp[i] = 0;
        i--;
      }else{
        flag = 0;
      }
    }
    tempIp = intIp.join('.');
  }
  ipArray.push(toIp);
  getAllIpHostName();
}

getAllIpHostName = () => {

  printAllHost = (hosts) => {
    console.log("starting printing hostnames...");
    hostName.map((host) => {
      console.log(host);
    });
  }

  runExec = (ip) => {
    return new Promise(function(resolve, reject) {
      exec(`host ${ip}`, function (err, stdout, stderr) {
        hostName.push('http://'+stdout.substring(stdout.lastIndexOf(" ")+1,stdout.length-2));
        resolve({stdout, stderr});
      });
    });
  }

  promisesToFetchIpHost = ipArray.map(function(ip) {
    console.log(`processing ${ip}...`);
    return runExec(ip);
  })

  return Promise.all(promisesToFetchIpHost)
  .then((hostArray) => printAllHost(hostArray))
  .then(()=>{
    fs.writeFileSync("hostName.txt",hostName.join(","));
    console.log("entering webSiteCheck...\nplease run checkForProductSite.js file");
    // webSiteCheck(0.45);
  })
  .catch((err) => console.log(err))
}

/*=============================================================================*/
send = (options)=> {
  return new Promise(function (resolve, reject){
      request(options, function (err, res, body) {
        return resolve(body);
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

function webSiteCheck(thresholdValue) {
  promisesToFetchCateg = hostName.map(function(item) {
    console.log("fetching webSiteCheck item - ", item);
    return fetchCategory(item)
  })

  const processHtmlDataList = (htmlDataList) => {
    console.log("processing webSiteCheck htmlDataList", htmlDataList.length);
    htmlDataList.forEach((htmlData) => {
        var yes=0,no=0,size=0,sum=0,mightData="";
        var $ = cheerio.load(htmlData.html);
        size=$('li').length+1;
        $('li').filter(function() {
          if(($(this).text().length>0)&&($(this).text().length<100)) {
            return true;
          }
            return false;

        }).each(function() {
          var newList;
          newList = $(this).text().toLowerCase().replace(/[^A-z0-9 ]/g,"").replace(/^\s+|\s+$|\s+(?=\s)/g,"").replace(/\W+/g," ");
          newList = newList.split(" ");
          newList.map((newItem) => {
            var element = newItem.replace(/\s+?/g,'');
            if(inputArray.indexOf(element) >= 0 && element.length>1){
              yes += 1;
              sum += 1;
              console.log('yes-',element);
            }else {
              no += 1;
              sum += 1;
              mightData += element + " ";
              console.log('no-',element);
            }
          })
        })
        var percentage = (yes/sum); //parseFloat(percentage) >= parseFloat(thresholdValue*100)
        if( parseFloat(percentage) >= parseFloat(thresholdValue) && sum > 20 ) {
          console.log("YES - probability ",percentage, htmlData.item);
          // fs.appendFile('categoryData.txt',mightData);
        }else {
          console.log("No -  probability ",percentage, htmlData.item);
        }
      })
      return Promise.resolve(0)
    }

    console.log(fromIp, " " , toIp);
    console.log("Before webSiteCheck all ");
    inputArray = fs.readFileSync('categoryData.txt', 'utf8');
    return Promise.all(promisesToFetchCateg)
    .then(processHtmlDataList)
    .catch((err)=> console.log("data error", err))
}
userInput = () => {
  fromIp = readlineSync.question("Enter from IP address : ");
  toIp = readlineSync.question("Enter to IP address : ");
  console.log(fromIp, " ", toIp);
  buildIpList(fromIp, toIp);
}
userInput();
