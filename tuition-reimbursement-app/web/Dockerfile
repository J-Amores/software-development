# The frontend's development server. The sources are mounted, so editing a file
# on the host reloads the page in the container.
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
EXPOSE 5173 5174
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]
