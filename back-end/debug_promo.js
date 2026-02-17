
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/promocodes/validate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            console.log('Validation Response:', JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log('Raw Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(JSON.stringify({ code: 'QWE' }));
req.end();
