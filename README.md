# Tech Grab

**Brief Overview** : This web application helps you uncover the technology behind any website. Simply enter a single URL or upload a CSV file containing multiple URLs, and Tech Grab will identify the specific technologies used on each website. It goes beyond just naming the technologies - Tech Grab also provides a level of confidence in the detection.

In simpler terms, Tech Grab lets you peek under the hood of any website and see the building blocks that make it function.

## Table of Contents
- [Requirements](#requirements)
- [Installation](#installation)
- [Docker Installation](#docker-installation)
- [Running the Project](#running-the-project)
- [License](#license)

## Requirements

- Node (>=20.13.0)

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/official-grabbers/tech_grab
    ```

1. Navigate to the project directory:

    ```bash
    cd tech_grab
    ```

## Running the Project

1. To install the dependencies of this project

    ```
    npm install
    cd /usr/src/app/src && npm install
    ```

1. Install required system dependencies for Puppeteer and Chromium

    ```
    sudo apt update && apt install -y chromium --fix-missing
    ```


1. Set environment variable to use Chromium instead of Chrome

    ```
    ENV CHROME_BIN=/usr/bin/chromium-browser
    ```

1. To run the project on your machine

    ```
    nodemon app.js
    ```

The development server will be running at http://localhost:8888/ or http://127.0.0.1:8888/.

## Docker Installation

To run the application using Docker, follow these steps:

1. Build the Docker image:

    ```
    docker-compose build
    ```
2. Run the Docker container:

    ```
    docker-compose up -d
    ```

The development server will be running at http://localhost:8888/ or http://127.0.0.1:8888/.

## License
- None
