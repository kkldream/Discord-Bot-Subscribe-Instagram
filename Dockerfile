FROM node:14.20.0-slim
WORKDIR /home/node/Discord-Bot-Subscribe-Instagram
COPY . .
RUN npm install
CMD ["npm", "run", "start"]
