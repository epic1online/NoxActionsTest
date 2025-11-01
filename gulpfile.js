const gulp = require("gulp");
const fs = require("fs");
const path = require("path");
const dartSass = require("sass");
const sass = require("gulp-sass")(dartSass);
const rename = require("gulp-rename");
const insert = require("gulp-insert");
const glob = require("glob");

const META = `/*//META{"name":"NoxDev","description":"A theme for Discord loosely based on Google's Material Design Guidelines.","author":"Lilian Tedone & Zerebos","version":"2.0.0"}*//**/

`;

const LICENSE = `/*
 *  Copyright (c) 2016-2017 Lilian Tedone, 2017-2020 Zack Rauen
 * 
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *  
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

`;

// Credit to:
// https://coderwall.com/p/fhgu_q/inlining-images-with-gulp-sass

const sassInlineImage = function(options) {
    options = options || {};
	
	const svg = function(buffer) {
		const svg = buffer.toString()
			.replace(/\n/g, '')
			.replace(/\r/g, '')
			.replace(/\#/g, '%23')
			.replace(/\"/g, "'");

		return 'data:image/svg+xml;utf8,' + svg;
	};

	const img = function(buffer, ext) {
		return 'data:image/' + ext + ';base64,' + buffer.toString('base64');
	};

    const base = options.base || process.cwd();
    return function (args) {
        file = args[0].text;
        const relativePath = './' + file;
        const filePath = path.resolve(base, relativePath);
        const ext = path.extname(filePath).slice(1);
		const data = fs.readFileSync(filePath);
		const str = ext === 'svg' ? svg(data) : img(data, ext);
		return new dartSass.SassString(str);
	};
};


const sassOptions = {
	functions: { "inline-image($file)": sassInlineImage() },
	style: "compressed"
};

function generateTempScss() {
    const stylesDir = path.resolve("./src/styles");
    const tmpFile = path.resolve("./_tmp.scss");
    const files = glob.sync("**/*.scss", { cwd: stylesDir });

    const content = files
        .map(file => {
            const rel = path.relative(path.resolve('./'), path.join(stylesDir, file)).replace(/\\/g, "/");
            const folder = path.basename(path.dirname(rel));
            const base = path.basename(file, ".scss").replace(/[^a-zA-Z0-9_-]/g, '');
            const safeName = `${folder}_${base}`;
            return `@use '${rel}' as ${safeName};`;
        })
        .join("\n");

    fs.writeFileSync(tmpFile, content);
    return tmpFile;
}

gulp.task("import", function () {
    generateTempScss();
    return gulp.src("./src/index.scss")
    .pipe(sass(sassOptions).on("error", sass.logError))
    .pipe(rename({basename: "import", extname: ".css"}))
    .pipe(insert.prepend(LICENSE))
    .pipe(gulp.dest("./release/"));
});

gulp.task("sass", function () {
    generateTempScss();
    return gulp.src("./src/index.scss")
        .pipe(sass.sync(sassOptions).on("error", sass.logError))
        .pipe(rename({basename: "NoxDev.theme", extname: ".css"}))
        .pipe(insert.prepend(META + LICENSE))
        .pipe(gulp.dest("Z:/Programming/BetterDiscordStuff/themes"));
});

gulp.task("sass-watch", function() {
    return gulp.watch(["./src/**/*.scss"]).on("all", gulp.series("sass"));
});
