const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");

const Links = require("./links.json");

async function launch() {
    console.log(`
███████╗██╗░░░░░██╗░░░██╗███████╗███████╗██╗░░░██╗
██╔════╝██║░░░░░██║░░░██║██╔════╝██╔════╝╚██╗░██╔╝
█████╗░░██║░░░░░██║░░░██║█████╗░░█████╗░░░╚████╔╝░
██╔══╝░░██║░░░░░██║░░░██║██╔══╝░░██╔══╝░░░░╚██╔╝░░
██║░░░░░███████╗╚██████╔╝██║░░░░░██║░░░░░░░░██║░░░
╚═╝░░░░░╚══════╝░╚═════╝░╚═╝░░░░░╚═╝░░░░░░░░╚═╝░░░`);

    console.log(new Date(), "| Start and open a browser");

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log(new Date(), "| Start handling links");
    for (let address of Links) {
        console.log(new Date(), "| Go to page " + address);
        await page.goto(address, { waitUntil: "load" });
        console.log(new Date(), "| Wait until load");
        await page.waitForTimeout(2000);

        console.log(new Date(), "| Get required data");
        const page_Tag = await page.$("h1");
        const tittle = await (
            await page_Tag.getProperty("textContent")
        ).jsonValue();
        const images = await page.evaluate(() =>
            Array.from(document.querySelectorAll("img"), (element) => element.src)
        );

        console.log(new Date(), "| Create new folder: " + tittle);
        createDir(await save_tittle_name(tittle));
        for (let i = 1; i <= images.length; i++) {
            try {
                const config = {
                    method: "get",
                    responseType: "arraybuffer",
                    url: images[i - 1],
                    headers: {},
                };

                const response = await axios(config);
                const buffer = Buffer.from(response.data, "utf8");

                fs.writeFileSync(
                    `downloads/${await save_tittle_name(tittle)}/${i}.png`,
                    buffer,
                    "base64"
                );

                console.log(
                    new Date(),
                    "| Loaded image: " + i + "/" + images.length,
                    `Path: /downloads/${tittle}/${i}.png`
                );
            } catch (error) {
                console.log(new Date(), "| Error ", error);
            }
        }
        console.log(new Date(), "| Completed: " + address);
    }
    console.log(new Date(), "| Closing. Have a nice day =)");
    await page.waitForTimeout(2000);
    browser.close();
}

function createDir(tittle) {
    try {
        fs.mkdirSync(`downloads/${tittle}`);
        return;
    } catch (err) {
        console.log(err);
    }
}

async function save_tittle_name(tittle) {
    return tittle.replaceAll("/", " ");
}

launch();
