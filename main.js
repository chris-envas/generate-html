const walkdir = require('walkdir')
const fs = require('fs')
const { default: parseMD } = require('parse-md');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
const del = require('del');
const {join} = require('path')
const mkdir = require('./util/mkdir.js')

async function start() {
    // 1. del用于删除上一次生成的静态文件
    del(['./public/articles/**.html', './public/index.html']);
    
    // 2. 收集src目录下的所有markdown文件的路径
    const paths = await walk('./src');
    console.log(paths)

    // 3. 读取所有markdown文件并生成html
    const indexData = await parseMDtoHTML(paths);
    console.log(indexData)
    // 4. 生成首页index.html
    await generateIndex(indexData);
}

// 执行start函数
start();

async function walk (srcPath) {
    let result = await walkdir.async(srcPath,{return_object: true})
    const mdPaths = []
    
    Object.entries(result).forEach(([path, fileStatus]) => {
        if(!fileStatus.isDirectory() && path.match(/\.md$/ig)) {
            mdPaths.push(path)
        }
    })
    return mdPaths;
}

function htmlTemplate(content, title = '站点标题', isArticle = false) {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>站点标题</title>
        <link rel="stylesheet" href="${isArticle ? '../styles.css' : './styles.css'}"> 
    </head>
    <body>
    <header>${title}</header>
    <ul>
        ${content}
    </ul>
    <footer> Simple Blog 2019-2020 </footer>
    </body>
    </html>
    `;
}

// 将markdown文件渲染为HTML静态文件
function parseMDtoHTML(paths = []){
    // paths是一个数组，存放了我们上一步中收集到所有的md文件路径
    let indexData = [];
    for (let i = 0; i < paths.length; i++) {
        const str = fs.readFileSync(paths[i], 'utf8');

        // 读取markdown文件的源信息和内容，得到标题、日期等，之后生成首页也要用到这些元信息
        const { metadata, content } = parseMD(str);
        const { title, date } = metadata;
   
        // indexData之后用于生成首页
        const mdHtml = md.render(content);
        const articleHtml = `<article>
                <h2>${title}</h2>
                <p>${date.toLocaleDateString()}</p>
                ${mdHtml}
            </article>`;
        const fileTitle = title.replace('/\s/g', '-');

        const writePath = join(__dirname,'public/articles')
        mkdir(writePath)
        fs.writeFileSync(join(writePath,`${fileTitle}.html`), htmlTemplate(articleHtml, '文章页', true));
        indexData.push({ ...metadata, fileTitle });
    }
    return indexData;
}

function generateIndex(indexData = []){
    // indexData所用的是第三部中收集的文章元信息数组，用于生成文章的链接
    const listHTML = indexData.map(i => {
        return `
<li>
    <a href="./articles/${i.fileTitle}.html">${i.title}</a>
    <time>${i.date.toLocaleDateString()}</time>
</li>
`
    }).join('');

    // htmlTemplate函数具体见第三步
    const indexHTML = htmlTemplate(listHTML);
    fs.writeFile('./public/index.html', indexHTML, function () {
        console.log(`写入index.html 成功`);
    });
}