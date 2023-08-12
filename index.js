const axios = require("axios")
const cheerio = require('cheerio')
const fs = require("fs")
const fsAsync = require('fs').promises;

const Links = require("./links.json")

const telegraph_api = "https://telegra.ph"
const file_extension = ".png"
const path_to_downloads_dir = "downloads/"

async function download_images_from_telegraph(urls) {
    console.log(`
███████╗██╗░░░░░██╗░░░██╗███████╗███████╗██╗░░░██╗
██╔════╝██║░░░░░██║░░░██║██╔════╝██╔════╝╚██╗░██╔╝
█████╗░░██║░░░░░██║░░░██║█████╗░░█████╗░░░╚████╔╝░
██╔══╝░░██║░░░░░██║░░░██║██╔══╝░░██╔══╝░░░░╚██╔╝░░
██║░░░░░███████╗╚██████╔╝██║░░░░░██║░░░░░░░░██║░░░
╚═╝░░░░░╚══════╝░╚═════╝░╚═╝░░░░░╚═╝░░░░░░░░╚═╝░░░`);
    for (let url of urls) {
        try {
            const html = await get_html(url)
            // console.log(html)
            const { image_src_list, tittle } = extract_image_src(html)
            const clean_tittle = clean_text(tittle, { " ": " " })

            await create_directory_if_not_exists(clean_tittle)
            await get_images(image_src_list, clean_tittle)
        } catch (error) {
            console.log(error)
        }
    }
}

async function get_html(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error(`Помилка при отриманні HTML: ${error.message}`);
    }
}

function extract_image_src(html) {
    try {
        const $ = cheerio.load(html);
        const image_src_list = [];
        const tittle = $('h1').first().text();

        $('img').each((index, element) => {
            const src = $(element).attr('src');
            if (src) {
                image_src_list.push(src);
            }
        });

        return {
            image_src_list,
            tittle
        };
    } catch (error) {
        console.log(error)
    }
}

async function get_images(image_urls, file_name) {
    for (let i = 1; i <= image_urls.length; i++) {
        try {
            let url = telegraph_api + image_urls[i - 1]

            if (image_urls[i - 1].includes("https://")) {
                url = image_urls[i - 1]
            }

            download_single_image(url, file_name, i + file_extension)
        } catch (error) {
            console.log(error)
        }
    }
}

async function download_single_image(image_url, dir_name, index) {
    try {
        const response = await axios({
            method: 'get',
            url: image_url,
            responseType: 'stream',
        });

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(path_to_downloads_dir + dir_name + "/" + index);
            response.data.pipe(writeStream);
            writeStream.on('finish', () => {
                console.log(`Dowloaded ${dir_name}/${index}`);
                resolve();
            });

            writeStream.on('error', (err) => {
                console.log(err)
                reject(err);
            });
        });
    } catch (error) {
        console.log(error.message)
    }
}

function clean_text(input_text, replacements = {}) {
    const allowed_characters_regex = /[^a-zA-Zа-яА-Я0-9\-_]/g;
    const cleaned_text = input_text.replace(allowed_characters_regex, (match) => {
        return replacements[match] || '';
    });

    return cleaned_text;
}

async function create_directory_if_not_exists(directory_path) {
    try {
        await fsAsync.mkdir(path_to_downloads_dir + directory_path);
        console.log(`Створено папку '/${directory_path}'`);
    } catch (err) {
        if (err.code === 'EEXIST') {
            console.log(`Папка '${directory_path}' вже існує.`);
        } else {
            console.error('Помилка при створенні папки:', err);
        }
    }
}

download_images_from_telegraph(Links)