/**
 * This program uses SOURCE.md to generate /static/index.html.
 * @author Ralph Louis Gopez
 */

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname);

const showdown = require('showdown');
const cheerio = require('cheerio');
const { minify } = require('html-minifier');

/**
 * This is where the conversion happens. It also properly adds metadata and 
 * stylesheet for Github styling.
 */
function main() {

    // This is our converter that can parse markdown
    const converter = new showdown.Converter({
        emoji: true,
        metadata: true,
        openLinksInNewWindow: true,
        completeHTMLDocument: true
        
    });    
    
    // I'm using synchronous since there's no need for async, this is a build program after all.
    let text = fs.readFileSync('SOURCE.md', { encoding: 'utf8'});
    let converted = converter.makeHtml(text);

    // Cheerio allows us to parse text as HTML and manipulate it like JQuery.
    let $ = cheerio.load(converted);

    // Check out SOURCE.md metadata, this just parses it to an array of strings formatted in HTML.
    let metadata = metadataToHTML(converter.getMetadata());

    // We don't need the current metadata, they are formatted wrong.
    $('meta').remove();
    $('head').append($('<meta name="viewport" content="width=device-width, initial-scale=1.0" />'));

    // This properly appends all the metadata.
    metadata.forEach(meta => {
        $('head').append($(meta));
    });

    // This uses the CDN for Github Markdown CSS Styling.
    $('head').append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css"/>');
    
    // We wrap everything in an article tag as recommended.
    let articleWrapper = $('<article style="margin: 20px" class="markdown-body"></article>').append($('body').html());
    $('body').addClass('markdown-body').attr('style', 'padding-top: 20px');
    $('body').children().remove();
    $('body').append(articleWrapper);

    let minified = minify($.root().html(), { 
        html5: true,
        minifyCSS: true,
        keepClosingSlash: true,
        collapseWhitespace: true
    });

    if ( !fs.existsSync(path.join(root, 'static')) ) {
        fs.mkdirSync( path.join(root, 'static') );
    }
    
    fs.writeFileSync( path.join(root, 'static', 'index.html'), minified, { encoding: 'utf8', flag: 'w' } );
}

/**
 * Use to generate metadata as Array of Strings from object.
 * @param {*} metadata is a dictionary where keys correspond to the 
 * name/property value and objects correspond to content value.
 * @returns Array of Strings that are written as HTML meta tags.
 */
function metadataToHTML(metadata) {
    let tags = [];

    for ( const [key, value] of Object.entries(metadata) ) {
        let attribute = key.includes('og') ? 'property': 'name';
        let properKey = key.replace(/-/g, ':');
        let tag = `<meta ${attribute}="${properKey}" content="${value}" />`;
        tags.push(tag);
    }

    return tags;
}

main();