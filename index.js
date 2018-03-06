const fs = require('fs');
const moment = require('moment');
const readlineSync = require('readline-sync');
const fetch = require("node-fetch");
const wget = require('node-wget');
const config = require('./config');

Promise.all([
    getDates(config.dateListLocation),
    roverPrompt()
])
.then(downloadImageList)
.then(downloadImages)
.catch(errHandler);

function getDates(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            if (err) {
                reject(err);
            }
            let dates = data.toString()
                .split('\n')
                .filter(line => line.length)
                .map(makeISODate)
                .filter(date => {
                    if (moment(date).valueOf() > moment().valueOf()) {
                        let error = `${date} appears to be in the future or 100 years ago. Let's skip it.`;
                        console.error(error);
                        return false;
                    }
                    return true;
                });
            resolve(dates);
        });
    });
}

function roverPrompt() {
    return new Promise((resolve) => {
        const rovers = config.rovers;
        const selectedRoverIndex = readlineSync.keyInSelect(rovers, 'For which rover should we download images?');
        resolve(rovers[selectedRoverIndex].toLowerCase());
    });
}

function destinationPrompt() {
    return new Promise((resolve) => {
        let destinationDirectory = readlineSync.questionPath(`Where should we save the images? [${config.destDirectory}]`, {
            exists: null,
            create: true,
            isDirectory: true,
            defaultInput: config.destDirectory
        });
        console.log(`Images will be saved at ${destinationDirectory}`);
        resolve(destinationDirectory);
    });
}

function downloadImageList(args) {
    let [dates, rover, destination] = args;
    let endPointTemplate = config.endPoint.replace('[ROVER]', rover);
    let requests = dates.map(( date => `${endPointTemplate}?earth_date=${date}&api_key=${config.apiKey}` ));

    let requestPromises = requests.map(request => {
        return fetch(request)
        .then(response => response.json())
        .then(jsonResp => {
            if (jsonResp.photos) {
                return jsonResp.photos.map(img => img.img_src);
            }
        }).catch(errHandler);
    });

    return new Promise((resolve, reject) => {
        Promise.all(requestPromises).then(requests => {
            resolve([].concat.apply([], requests));
        });
    });

}

function downloadImages(images) {
    return destinationPrompt().then(destination => {
        images.forEach(image => {
            //console.log('image', image);
            let options = {
                url: image,
                dest: destination.match(/\/$/) ? destination : destination + '/'
            };
            wget(options, (error, response) => {
                if (error) {
                    console.error("An error has occured: ", error);
                }
                console.log(`Downloaded image: ${image}`);
            });
        });
    });
}

function makeISODate(nonISODate) {
    return moment(nonISODate, 'DD-MMM-YY').format('YYYY-MM-DD');
}


function errHandler(error) {
    console.error(`The following error occured: ${error}`);
}
