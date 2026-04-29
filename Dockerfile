# Use a stable Node.js runtime as the base image
FROM node:25-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies and curl for healthchecks
RUN apk add --no-cache curl && npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the API and P2P ports
EXPOSE 7000
EXPOSE 6000

# Start the node
CMD ["npm", "start"]
