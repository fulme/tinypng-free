# gulp-tinypng-free
Use the upload api of tinypng's homeage to compress images, so can use it without key.

- 模拟用户上传和下载的行为，来得到压缩图片，突破使用官网api每月500张限制
- 通过hash摘要缓存已压缩的文件，只针对有变化的文件进行压缩，避免了重复劳动，提高效率

## Why
图片是影响页面加载速度的重要因素，文本代码通常不会很大，在服务端开启`gzip`压缩可以有一个比较大的压缩率。
但图片本身就是经过压缩的，所以`gzip`基本不会有任何作用，所以[tinypng](https://tinypng.com/)值得你拥有！
保守估计，本插件可以压缩掉**40% ~ 50%**, 而对图片质量影响很小！
相比而言，大家熟知的[imagemin](https://www.npmjs.com/package/gulp-imagemin)能压缩10%就不错了。


## Install
```
$ npm i gulp-tinypng-free
```

## How to use
```
var gulp = require('gulp');
var tinypngFree = require('gulp-tinypng-free');

gulp.task('tinypng', function(cb) {
    gulp.src('src/*')
        .pipe(tinypngFree({}))
        .pipe(gulp.dest('dist'));
});
```

## API
### tinypngFree([options])

Returns Stream containing compressed images

#### options
Type: `Object`
Default: `{}`

Sets options described below from its properties.

#### options.signFile
Type: `String`
Default: `./sign.json`

If set to a filename, it will compare existing source file md5 signatures against those found in the file's json data. When the signatures match, the file is skipped from being minified again, allowing you to better stay within your API request limits. When an image is minified, the md5 signature is determined from the unminified source image and written to the file at options.sigFile (a suggested location would be somewhere under your source control).

Signatures are based off the unminified source image, so that when the source changes it will be re-minified and re-written to the destination file.

#### options.force
Type: `Boolean`
Default: `false`

Force compress images regardless of signature. Value can either be `true` to force all images, or a glob pattern string to match against the filename(s).


## Intro
need upload files, so it may be unstable.Recommand to move this to the end of task.

尽量放到任务的最后一步，因为这个过程是要上传图片，再下载图片的，和网络稳定有关

## Reference
https://github.com/creativeaura/gulp-tinypng  
https://github.com/stnvh/gulp-tinypng-compress  
https://github.com/paper/gulp-tinypng-nokey  