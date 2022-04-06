console.log("RBX-GET BY CLORO");
const { readJSONSync, createWriteStream, createFileSync, appendFileSync, ensureDirSync, existsSync } = require('fs-extra');
const { join } = require('path');

const http = require('https');
const input = readJSONSync(join(__dirname, 'input.json'));
const settings = readJSONSync(join(__dirname, 'settings.json'));

console.log(`GOT JSON WITH ID SIZE: ${input.length}`);

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }   

ensureDirSync(join(__dirname, 'output'));
const outPath = join(__dirname, 'cdn-links.txt');
const errPath = join(__dirname, 'err-path.txt');

const out = createFileSync(outPath);
async function run() {
    await sleep(1000);

    for (let i = 0; i < input.length; i++) {
        const id = input[i];

        console.log(`REQUEST GET: ${id}`);
        try {
            await http.get({
                path: `/v1/assetId/${id}`,
                port: 443,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                host: 'assetdelivery.roblox.com'
            }, response => {
                    const filePath = join(__dirname, `output/${id}.rbxmx`);
                    const ifExist = existsSync(filePath);

                    if (!ifExist) {
                        const file = createWriteStream(filePath);
                        response.on('data', async (chunk) => {
                            let js = JSON.parse(chunk);
                            
                            console.log(`REQUEST GET SUCCESS: ${id}`);
                            appendFileSync(outPath, `${i} | ID: ${id} | URI: ${js.location}\n`);
    
                            const convPath = js.location.replace(/(https\:\/\/c[0-9]\.rbxcdn\.com)/, "")
                            const convHost = js.location.match(/(c[0-9]\.rbxcdn\.com)/)[0];
                            console.log(`CDN ID: ${convPath}`);
                            console.log(`CDN: ${convHost}`);
    
                            await http.get({
                                path: convPath,
                                port: 443,
                                method: 'GET',
                                protocol: 'https:',
                                agent: http.Agent({keepAlive: true}),
                                host: convHost}, async (response) => {
                                await response
                                        .pipe(file)
                                        .on("finish", () => {
                                            console.log(`FINISHED PIPING FOR: ${id} INDEX ${i} [WRITTEN: ${filePath}]`)
                                        })
                                })
                        });
                    } else
                        console.log(`ID: ${id} ALREADY EXISTS. IGNORING.`)
                })
        } catch (err) {
            console.log(`ID: ${id} | INDEX: ${i} ERRORED. STACK TRACE: ${err}`)
            
            if (settings["write-logs"]) {
                console.log(`WRITING ID ON LOGS.`);
    
                appendFileSync(errPath, `ERROR: ID: ${id} | INDEX: ${i}\n`);
            }
        }
        
        await sleep(500 * settings.interval); // measured in ms
    }
}

run();