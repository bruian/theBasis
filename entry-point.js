/* Основная точка входа, сперва загружается babel для траспиляции кода с целью поддержки 
ES6/ES7. Так же указывается какие файлы требуется игнорировать JS при использовании 
import выражений. И загружаются полифилы для поддержки кода остальными браузерами. В за-
ключении указывается точка входа в серверное приложение */
require('babel-core/register'); // babel registration (runtime transpilation for node)
['.css', '.less', '.sass', '.ttf', '.woff', '.woff2'].forEach((ext) => require.extensions[ext] = () => {});
require('babel-polyfill');

require('./server/server.js');
