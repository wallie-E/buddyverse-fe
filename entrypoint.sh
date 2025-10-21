#!/bin/bash

app_env=${1:-development}

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Development environment commands
dev_commands() {
    echo "Running React development environment..."
    npm run dev
}

# Production environment commands
prod_commands() {
    echo "Running React production environment..."
    npm run dev
   
}

# Check environment variables to determine the running environment
if [ "$app_env" = "production" ] || [ "$app_env" = "prod" ] ; then
    echo "Production environment detected"
    prod_commands
else
    echo "Development environment detected"
    dev_commands
fi
