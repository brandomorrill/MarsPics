const os = require('os');

module.exports = {
    endPoint: 'https://api.nasa.gov/mars-photos/api/v1/rovers/[ROVER]/photos',
    apiKey: 'DEMO_KEY',
    dateListLocation: './MarsDates.txt',
    destDirectory: `${os.homedir()}/marsPics/`,
    rovers: ['Curiosity', 'Opportunity', 'Spirit']
}