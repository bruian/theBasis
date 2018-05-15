# theBasis

## About theBasis (Vue + vue-router + vuex + ssr vue + auth) + Webpack

This **basis** is designed for: 

- Be the basis for market applications
- Provide the ability to clone the foundation for other applications
- Allow access rights settings and authentication

## Application Architecture

- Server Side Rendering
  - Vue + vue-router + vuex working together
  - Server-side data pre-fetching
  - Client-side state & DOM hydration
  - Automatically inlines CSS used by rendered components only
  - Preload / prefetch resource hints
  - Route-level code splitting
- Progressive Web App
  - App manifest
  - Service worker
  - 100/100 Lighthouse score
- Single-file Vue Components
  - Hot-reload in development
  - CSS extraction for production
- Animation
  - Effects when switching route views
  - Real-time list updates with FLIP Animation

- Isomorphic client-server application
- [Node.js](https://nodejs.org/en/) + [Express.js](http://expressjs.com/) simple web-service
- [Babel](https://babeljs.io/) транспилятор для JavaScript предоставляет обратную совместимость современных стандартов  ES-2015, а так же поддержку большого количества полифилов для распространенных функций JS, поддерживает JSХ и Flow
- Error handling
- RESTful API endpoints, CRUD
- [MongoDB](https://www.mongodb.com/) and [Mongoose.js](http://mongoosejs.com/)
- Access control - OAuth 2.0, [Passport.js](http://www.passportjs.org/)

## Agreement

- Versioning: [SemVer](https://semver.org/lang/ru/)

## Installation

```bash
$ git clone https://github.com/bruian/theBasis.git

# install dependencies
npm install

# rename _config-private.js to config-private.js and set db connection string (your DB)

# create new testing user in your mongoDB
npm renewuser

# serve in dev mode, with hot reload at localhost:8080
npm run dev

# build for production
npm run build

# serve in production mode
npm start
```
## Documentation

> Coming soon on GitBook

## Version

- "0.0.1":
  - Create an application structure
  - Configuring the Webpack assembly
  - Connecting vuex
  - Connecting vue-router
  - Connecting a vue-server-render
  - Connecting vue-bootstrap
  - Creating and configuring basic application modules
- "0.0.2":
  - Refactoring the server into a separate instance
  - Configuring api modularity for the server
  - Creating an authentication server
  - Connecting mongoose + mongoDB
  - re-setup config

## RoadMap

- Вынести в отдельный Express модуль vue server route
- Решить проблему обрыва подключения к DB. Как должен отвечать сервер, должен ли он дожидатся подключения или сразу отпускать клиента
(техн.долг: выдача предупреждения о потере соединения с DB)

## Description
- package.json описывает конфигурацию и состав пакета, скрипты для развертывания и запуска приложения
- .babelrc описывает конфигурацию транспилятора babel. В данной конфигурации используются следующие настройки:
    [Stage 0](https://babeljs.io/docs/plugins/preset-stage-0/) пакет включающий transform-do-expression и transform-function-bind
    [es2015](https://babeljs.io/docs/plugins/preset-es2015) пакет включающий большой набор пресетов для поддержки стандарта ES-2015
    [React](https://babeljs.io/docs/plugins/preset-react/) пакет включающий набор пресетов для поддержки React и JSX

## License

The MIT License (MIT)

Copyright (c) 2017-present, maus.club co

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.