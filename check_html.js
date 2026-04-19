const https = require('https');
https.get('https://www.ambaraartha.com/sign-in', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const divIdx = body.indexOf('class="flex items-center');
        const endIdx = body.indexOf('</body>');
        console.log("PAYLOAD HAS bg-slate?", body.includes('bg-slate'));
        console.log("RSC PAYLOAD HAS ERROR?", body.includes('notFound'));
        console.log("RSC PAYLOAD HAS CLERK PK?", body.includes('pk_live_Y2xlcmsuYW1iYXJhYXJ0aGEuY29tJA'));
    });
});
