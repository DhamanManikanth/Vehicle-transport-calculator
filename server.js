import express from 'express';
import fs from 'node:fs/promises';
import path from 'path';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep track of the parent directory that `server.js` resides in; we'll use this later.
const __dirname = dirname(fileURLToPath(import.meta.url));


// Try grabbing the PORT and HOST variables from the environment, or use localhost:8000 as a default.
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const HOST = process.env.HOST ?? 'localhost';


// `app` refers to this particular server, the one we'll add behavior to.
const app = express();

const vehicleData = {
    "alto": { speed: 140, efficiency: 22.05, tank: 35, range: 771.75 },
    "hyundai": { speed: 180, efficiency: 20.35, tank: 37, range: 753.05 },
    "tatanexon": { speed: 180, efficiency: 17.57, tank: 44, range: 772.68 },
    "hondacity": { speed: 180, efficiency: 17.8, tank: 40, range: 712.00 },
    "thar": { speed: 155, efficiency: 15.2, tank: 57, range: 866.40 },
    "crysta": { speed: 179, efficiency: 11.25, tank: 55, range: 618.75 },
    "kiaseltos": { speed: 170, efficiency: 16.8, tank: 50, range: 840.00 },
    "kwid": { speed: 150, efficiency: 22.3, tank: 28, range: 624.40 },
    "ford": { speed: 182, efficiency: 15.9, tank: 52, range: 826.80 },
    "tatatiago": { speed: 150, efficiency: 23.84, tank: 35, range: 834.40 }
};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/vehicle-speeds', (request, response) => {

  response.send('result');


});




// app.use() asks our server to use some **middleware**, which can intercept and handle requests
//   before our custom request handlers are invoked.
app.use(
  // The built-in `express.static` middleware directs Express to look in a particular directory
  //   (the local 'public' directory, in our case) for files requested by clients. For example,
  //   if the user visits `/a.html`, Express will look for `public/a.html` and, if the file is
  //   found, read the contents of the file and return those contents to the user.
  // This is especially useful for assets without dynamic content like images, .css, and .js files,
  //   since we can add them to our project folder and use them without having to ask the server
  //   explicitly to serve each new file we add.
  // Note that `express.static` will send the contents of `index.html` if no path is specified
  //   (i.e. http://localhost:8000/), as is standard. You can configure this if you'd like:
  //   https://expressjs.com/en/4x/api.html#express.static
  express.static('public/'),
);

// That said, we don't *need* to have a file in the filesystem for every route on the server.
//   In this case, we construct a response and send it straight to the client without ever reading
//   from a file. The `.html` extension here is deceptive; there is no real hello-world.html file
//   on the server.
// You can try this by visiting http://localhost:8000/hello-world.html in your browser. Try changing
//   the response text in this server code (but make sure to restart the server first)!
app.get('/hello-world.html', (request, response) => {
  response.status(200).send('Hello, world!');
});

// We can dynamically generate a response, if we'd like, rather than sending the same thing
//   every time. Try visiting http://localhost:8000/random a few times in your browser.
// The "200" status code, by the way, just tells the browser that everything went
//   fine (you can compare this to 404 or 500, which are error codes). A list of status codes
//   is available at https://http.cat/.
app.get('/random', (request, response) => {
  response.status(200).send(Math.random().toString());
});

// When we receive a request, we can decide what to respond based on details about the request.
//   In this case, we're using an Express syntax to fetch parameters from the URL.
// Try visiting http://localhost:8000/add/12/34 -- now we have an *infinite* number of routes,
//   even though there's no actual underlying HTML file being served to the user.
app.get('/add/:first/:second', (request, response) => {
  const a = parseInt(request.params.first, 10); // Grab the param called "first" and convert to an int
  const b = parseInt(request.params.second, 10); // The second argument to parseInt parses in base-10

  const sum = a + b;

  response.status(200).send(sum.toString());
});



app.get('/a', async (request, response) => {
  const htmlContents = await fs.readFile('public/a.html');
  response.status(200).send(htmlContents.toString());
});


app.get('/b', (request, response) => {
  response.status(200).sendFile('public/b.html', { root: __dirname });
});

app.get('/c', (request, response) => {
  response.status(200).sendFile('public/c.html', { root: __dirname });
});


app.get('/calculate', (req, res) => {
    const distance = parseFloat(req.query.distance);
    const vehicle = req.query.vehicle;

    if (!distance || !vehicle) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const vehicleInfo = vehicleData[vehicle];
    if (!vehicleInfo) {
        return res.status(400).json({ error: 'Invalid vehicle' });
    }

    
    const timeInHours = distance / vehicleInfo.speed;
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);

    
    const fuelNeeded = distance / vehicleInfo.efficiency;
    const isOutOfRange = distance > vehicleInfo.range;

    res.json({
        hours,
        minutes,
        fuel: fuelNeeded.toFixed(2),
        isOutOfRange
    });
});


app.get('/compare-all', (req, res) => {
    const distance = parseFloat(req.query.distance);
    
    if (!distance) {
        return res.status(400).json({ error: 'Distance is required' });
    }

    const results = {};
    
    for (const [vehicle, data] of Object.entries(vehicleData)) {
        
        const timeInHours = distance / data.speed;
        const hours = Math.floor(timeInHours);
        const minutes = Math.round((timeInHours - hours) * 60);
        
        
        const fuelNeeded = distance / data.efficiency;
        const isOutOfRange = distance > data.range;
        
        results[vehicle] = {
            name: vehicle,
            hours,
            minutes,
            fuel: fuelNeeded.toFixed(2),
            isOutOfRange,
            maxRange: data.range,
            speed: data.speed
        };
    }
    
    res.json(results);
});


app.get('/calculate-duration', (req, res) => {
    const time = parseFloat(req.query.time);
    const speed = parseFloat(req.query.speed);
    
    if (isNaN(time) || isNaN(speed)) {
        return res.status(400).json({ 
            error: 'Please provide valid time and speed values' 
        });
    }

    
    const distance = speed * time;
    
    res.json({
        distance: distance.toFixed(2),
        time: time,
        speed: speed
    });
});



app.listen(PORT, HOST, () => {
  console.log(`Server listening at http://${HOST}:${PORT}`);
});
