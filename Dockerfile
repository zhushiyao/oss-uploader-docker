FROM node 
ADD lib/ossClient.js lib/ossClient.js
ADD bin/up.js bin/up.js
ADD package.json package.json
RUN npm install 
RUN npm install . -g


