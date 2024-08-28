# Use the official Node.js image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (e.g., TypeScript compilation)
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/index.js"]
