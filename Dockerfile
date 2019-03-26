FROM node:8.15
LABEL maintainer="bruianio@gmail.com"

WORKDIR /theBasis
COPY ./package.json /theBasis/
RUN npm config set registry http://registry.npmjs.org/ && npm install @babel/core @babel/cli -G
RUN npm install
COPY . /theBasis/
RUN mkdir /theBasis/logs && touch /theBasis/logs/all.log
RUN npm run build && npm run start
EXPOSE 8080
CMD ["npm", "run", "start"]

