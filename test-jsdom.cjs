const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('dist/index.html', 'utf8');

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });

dom.window.addEventListener('error', (event) => {
    console.error("JSDOM Error:", event.error);
});
dom.window.addEventListener('unhandledrejection', (event) => {
    console.error("JSDOM Unhandled Rejection:", event.reason);
});

setTimeout(() => {
    console.log("Loading overlay CSS display:", dom.window.document.getElementById('loading-overlay').style.display);
}, 2000);
