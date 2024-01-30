"use strict";
const { traceDeprecation } = require('process');
const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const path = require('path');



//openBrowser('https://www.scoala-mihaieminescu.ro/images/');

const folderName = `output/${process.env.URL.replace(/[\/:]/g, '_')}`
const screen = {
    width: 640,
    height: 480
  };
  

const options = new firefox.Options();
options.addArguments('--headless')
options.windowSize(screen);



openProgram();

async function openProgram() {
    global.driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();

    await checkAndCreateFolder(folderName)
    await openBrowser(process.env.URL, "")
}


async function openBrowser(link, pluspath) {
    await driver.get(link);

    const tableData = await driver.findElement(By.xpath('//*[@id="table-content"]/tbody'));

    let elements = await tableData.findElements(By.css('tr'));
    let allotp = [];
    for (const i in elements) {
        let otp = {};
        let rows = await elements[i].findElements(By.css('td'));
        otp.lastModified = await rows[1].getText();
        otp.size = await rows[2].getText();
        otp.type = await rows[0].findElement(By.css('img')).getAttribute('alt')
        otp.name = await rows[0].getText();
        otp.fullPath = link + otp.name;
        if (otp.type === "Up") delete otp.fullPath;
        if (otp.type === "Directory") otp.fullPath += '/';

        let altn = (await rows[0].findElement(By.css('a')).getAttribute('href')).split("/");
        otp.altpath = link + altn[altn.length-1];
        otp.altname = altn[altn.length-1];

        //console.log(otp);
        allotp.push(otp);
    }
    console.log(`Found ${allotp.length} files at ${link}${pluspath}`);

    for (const i in allotp) {
        if (allotp[i].type === "Up") continue;
        if (allotp[i].type === "Directory") {
            await checkAndCreateFolder(`${folderName}/${pluspath}${allotp[i].name}`)
            await openBrowser(allotp[i].fullPath, pluspath + `${allotp[i].name}/`);
            continue;
        }
        
        console.log(`Downloading file (${allotp[i].size}) from ${folderName}/${pluspath}${allotp[i].name}`);
        try {
            await downloadFile(allotp[i].fullPath, `${folderName}/${pluspath}${allotp[i].name}`)
        }
        catch(e) {
            console.log(e)
            console.log("Trying to download using altname");
            await downloadFile(allotp[i].altpath, `${folderName}/${pluspath}${allotp[i].altname}`.replace(/%/g, ''))

        }

    }
    console.log(`Writing json file at ${folderName}/${pluspath}files.json`)
    await writeJsonToFile(`${folderName}/${pluspath}files.json`, allotp);
}

async function downloadFile(url, destinationPath) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(destinationPath);

        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file from ${url}. Status code: ${response.statusCode}`));
                return;
            }

            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve(`File downloaded successfully to: ${destinationPath}`);
            });

            fileStream.on('error', (error) => {
                reject(new Error(`Error writing file: ${error.message}`));
            });
        }).on('error', (error) => {
            reject(new Error(`Error downloading file: ${error.message}`));
        });
    });
}

async function writeJsonToFile(filePath, jsonData) {
    try {
        const jsonString = JSON.stringify(jsonData, null, 4); // Use 4 spaces for indentation
        await fs.promises.writeFile(filePath, jsonString);
        console.log(`JSON data written to: ${filePath}`);
    } catch (error) {
        console.error(`Error writing JSON to file: ${error.message}`);
    }
}


async function checkAndCreateFolder(folderPath) {
    try {
        // Check if the folder exists
        await fs.promises.access(folderPath);
        console.log(`Folder already exists at: ${folderPath}\nbackup the folder and try again`);
        //throw new Error("skiping folder check (not recommended)");
    } catch (error) {
        // If the folder doesn't exist, create it
        if (error.code === 'ENOENT') {
            try {
                await fs.promises.mkdir(folderPath, { recursive: true });
                console.log(`Folder created at: ${folderPath}`);
            } catch (err) {
                console.error(`Error creating folder: ${err.message}`);
            }
        } else {
            console.error(`Error checking folder existence: ${error.message}`);
        }
    }
}