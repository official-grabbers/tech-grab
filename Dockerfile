# Use the official Node.js Alpine image as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install nodemon or pm2 globally
RUN npm install -g nodemon pm2

# Install required system dependencies for Puppeteer and Chromium
RUN apt update && \
    apt install -y chromium --fix-missing

# Set environment variable to use Chromium instead of Chrome
ENV CHROME_BIN=/usr/bin/chromium-browser

# Copy application code to the working directory
COPY . .

# Change directory to the app directory and install Node.js dependencies
RUN cd /usr/src/app/src && npm install


# Expose the port on which the Node.js application will run
EXPOSE 8888

# Command to run the Node.js application
CMD ["pm2-runtime", "app.js"]
# CMD ["node", "app.js"]
# CMD ["npx", "nodemon", "app.js"]

