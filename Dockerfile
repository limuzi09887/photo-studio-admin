FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD npx prisma db push && npm run build && npm start
