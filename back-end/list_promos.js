
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/promocodes',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Promocodes:', JSON.stringify(JSON.parse(data), null, 2));
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
