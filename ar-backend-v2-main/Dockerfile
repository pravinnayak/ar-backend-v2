FROM node:21.6.2

WORKDIR /app

# Copy the entire backend folder into the Docker image
COPY backend/ .

COPY backend/config/.env.production ./backend/.env

RUN npm install

EXPOSE 4800

CMD ["npm", "run", "start"]
