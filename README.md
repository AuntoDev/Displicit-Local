## What is displicit-local?
The displicit-local NPM package allows you to easily check images for explicit content - powered by the same AI the [Displicit Discord bot](https://displicit.auntodev.com) uses.

## How do I install this?
Simply run `npm install @auntodev/displicit-local --save` and it will be added to your project. When you require displicit-local, it will automatically fetch the files it needs (model files) from the internet.

## How do I use this?
First, require the package:
```js
let Displicit = require('@auntodev/displicit-local');
```    
    
You can now pass a URL through to the classifier:
```js
// async:
await Displicit.classify('https://example.com/image.png');

// then functions:
Displicit.classify('https://example.com/image.png').then((result) => {
    // do something here
}).catch(console.error);

// passing a function:
Displicit.classify('https://example.com/image.png', true, function (result) {
    // do something here
});
```    
    
Something simillar to this should be returned:
```json
{
  "sexy": { "name": "explicit", "pr": 0.000006322888111753855 },
  "porn": { "name": "pornography", "pr": 0.002326485700905323 },
  "hentai": { "name": "hentai", "pr": 0.7598042488098145 },
  "err": false
}
```    

## Understanding the output
Let's break down one of these objects.    
    
The `name` field is used as a better, more professional name for the check. This can be user facing.    
The `pr` field is a number. To get the percentage chance of the image being explicit, times this number by `100`.

## License
```
MIT License

Copyright (c) 2021 Aunto Development

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```