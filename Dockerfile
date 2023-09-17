FROM node:20-alpine

LABEL "version"="0.1.0"
LABEL "repository"="https://github.com/axazara/easy-s3-upload-github-action"
LABEL "homepage"="https://github.com/axazara/easy-s3-upload-github-action"
LABEL "maintainer"="Axa Zara Core Dev <core.dev@axazara.io>"

# Add the entry point
RUN mkdir /app
ADD index.js /app/index.js
ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
ADD entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN cd /app
WORKDIR /app
RUN npm install

# Load the entry point
ENTRYPOINT ["/app/entrypoint.sh"]
