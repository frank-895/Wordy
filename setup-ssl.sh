#!/bin/bash

# Script to setup SSL certificates for Docker development

echo "🔒 Setting up SSL certificates..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed. Please install it first:"
    echo "   brew install mkcert"
    exit 1
fi

# Install mkcert CA if not already installed
echo "📦 Installing mkcert CA..."
mkcert -install

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate certificates if they don't exist
if [ ! -f "ssl/localhost+2.pem" ] || [ ! -f "ssl/localhost+2-key.pem" ]; then
    echo "🔑 Generating SSL certificates..."
    cd ssl
    mkcert localhost 127.0.0.1 ::1
    cd ..
    echo "✅ SSL certificates generated successfully!"
else
    echo "✅ SSL certificates already exist!"
fi

echo "🚀 SSL setup complete! You can now run: docker-compose up --build" 