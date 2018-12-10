FROM node 
ADD package.json package.json
RUN npm install 
ADD lib/ossClient.js lib/ossClient.js
ADD lib/kong.js lib/kong.js
ADD lib/request.js lib/request.js
ADD bin/daily.js bin/daily.js
ADD bin/kong.js bin/kong.js
RUN npm install . -g

