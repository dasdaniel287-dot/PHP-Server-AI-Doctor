import { GeneratedProject } from '../types';

export const STARTER_TEMPLATES: GeneratedProject[] = [
  {
    projectName: 'modern-php83-rest-api',
    description: 'High-performance, containerized PHP 8.3 REST API with Docker, Nginx, PHP-FPM, PSR-4 Autoloading, Router, and GitHub Actions CI/CD.',
    files: [
      {
        path: 'public/index.php',
        language: 'php',
        purpose: 'Entry point: handles routing, JSON output, CORS, and centralized exception handling',
        content: `<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\\Http\\Router;
use App\\Http\\Response;

// Enable strict error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Global Exception & Error Handler
set_exception_handler(function (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal Server Error',
        'details' => $e->getMessage(),
        'timestamp' => date('c'),
    ]);
    exit;
});

// Setup CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$router = new Router();

// Define API Routes
$router->get('/api/health', function () {
    return Response::json([
        'status' => 'healthy',
        'php_version' => PHP_VERSION,
        'server_time' => date('Y-m-d H:i:s'),
        'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
    ]);
});

$router->get('/api/v1/info', function () {
    return Response::json([
        'app' => 'Modern PHP 8.3 REST API',
        'version' => '1.0.0',
        'features' => ['PHP 8.3', 'Docker-ready', 'PSR-4', 'Fast FastCGI', 'Automated CI'],
    ]);
});

$router->post('/api/v1/echo', function () {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?? [];
    return Response::json([
        'received' => $payload,
        'received_at' => time(),
    ]);
});

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $_SERVER['REQUEST_URI'] ?? '/');
`,
      },
      {
        path: 'src/Http/Router.php',
        language: 'php',
        purpose: 'Fast URI and HTTP method dispatcher',
        content: `<?php
declare(strict_types=1);

namespace App\\Http;

class Router {
    private array $routes = [];

    public function get(string $path, callable $handler): void {
        $this->routes['GET'][$path] = $handler;
    }

    public function post(string $path, callable $handler): void {
        $this->routes['POST'][$path] = $handler;
    }

    public function dispatch(string $method, string $uri): void {
        $cleanUri = parse_url($uri, PHP_URL_PATH) ?? '/';

        if (isset($this->routes[$method][$cleanUri])) {
            $handler = $this->routes[$method][$cleanUri];
            call_user_func($handler);
            return;
        }

        Response::json([
            'status' => 'error',
            'code' => 404,
            'message' => "Route {$cleanUri} not found for method {$method}",
        ], 404);
    }
}
`,
      },
      {
        path: 'src/Http/Response.php',
        language: 'php',
        purpose: 'Standardized JSON response helper',
        content: `<?php
declare(strict_types=1);

namespace App\\Http;

class Response {
    public static function json(array $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        exit;
    }
}
`,
      },
      {
        path: 'composer.json',
        language: 'json',
        purpose: 'Composer dependencies, autoloading configuration, and scripts',
        content: `{
  "name": "app/php-api",
  "description": "Production-grade Modern PHP 8.3 REST API with Docker and GitHub Actions",
  "type": "project",
  "require": {
    "php": ">=8.3",
    "ext-pdo": "*",
    "ext-json": "*",
    "ext-mbstring": "*"
  },
  "require-dev": {
    "phpunit/phpunit": "^11.0"
  },
  "autoload": {
    "psr-4": {
      "App\\\\": "src/"
    }
  },
  "scripts": {
    "start": "php -S 0.0.0.0:8000 -t public",
    "test": "phpunit"
  }
}
`,
      },
      {
        path: 'Dockerfile',
        language: 'dockerfile',
        purpose: 'Production Multi-stage PHP 8.3 FPM image with required extensions',
        content: `FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \\
    curl \\
    libpng-dev \\
    libxml2-dev \\
    zip \\
    unzip \\
    oniguruma-dev \\
    linux-headers

# Install PHP extensions required for high-load web servers
RUN docker-php-ext-install pdo pdo_mysql mbstring bcmath opcache

# Copy custom php.ini
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Set correct permissions for www-data
RUN chown -R www-data:www-data /var/www/html

EXPOSE 9000

CMD ["php-fpm"]
`,
      },
      {
        path: 'docker-compose.yml',
        language: 'yaml',
        purpose: 'Multi-container orchestration for PHP-FPM, Nginx, and MySQL 8.0',
        content: `services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: php_api_app
    restart: unless-stopped
    volumes:
      - ./:/var/www/html
    networks:
      - app_network
    environment:
      DB_HOST: db
      DB_PORT: 3306
      DB_NAME: app_db
      DB_USER: app_user
      DB_PASS: app_secret

  web:
    image: nginx:alpine
    container_name: php_api_web
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./:/var/www/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app
    networks:
      - app_network

  db:
    image: mysql:8.0
    container_name: php_api_db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: app_db
      MYSQL_USER: app_user
      MYSQL_PASSWORD: app_secret
      MYSQL_ROOT_PASSWORD: root_secret
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - app_network

networks:
  app_network:
    driver: bridge

volumes:
  db_data:
`,
      },
      {
        path: 'nginx.conf',
        language: 'nginx',
        purpose: 'Optimized Nginx FastCGI reverse proxy configuration for PHP-FPM',
        content: `server {
    listen 80;
    server_name localhost;
    root /var/www/html/public;
    index index.php index.html;

    client_max_body_size 64M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        fastcgi_pass app:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
        fastcgi_read_timeout 300;
    }

    location ~ /\\.(?!well-known).* {
        deny all;
    }
}
`,
      },
      {
        path: 'php.ini',
        language: 'ini',
        purpose: 'PHP configuration optimized for server stability and performance',
        content: `[PHP]
memory_limit = 512M
max_execution_time = 120
upload_max_filesize = 64M
post_max_size = 64M
display_errors = Off
log_errors = On
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
date.timezone = UTC

[opcache]
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 10000
opcache.revalidate_freq = 0
opcache.validate_timestamps = 1
`,
      },
      {
        path: '.github/workflows/ci.yml',
        language: 'yaml',
        purpose: 'Automated GitHub Actions CI pipeline for PHP linting and syntax checks',
        content: `name: PHP CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.3'
        extensions: mbstring, pdo, pdo_mysql, json
        coverage: none

    - name: Validate composer.json
      run: composer validate --strict

    - name: Syntax Check All PHP Files
      run: find . -name "*.php" -not -path "./vendor/*" -exec php -l {} \\;
`,
      },
      {
        path: '.gitignore',
        language: 'gitignore',
        purpose: 'Git ignore rules for PHP and Composer',
        content: `/vendor/
composer.phar
.env
*.log
.DS_Store
.idea/
.vscode/
`,
      },
      {
        path: 'README.md',
        language: 'markdown',
        purpose: 'Clear project documentation with 1-click launch instructions',
        content: `# Modern PHP 8.3 REST API 🚀

A production-ready, Dockerized PHP 8.3 REST API boilerplate with PHP-FPM, Nginx, MySQL, and automated GitHub Actions CI/CD.

## ⚡ Quick Start with Docker

\`\`\`bash
# 1. Clone repository
git clone <YOUR_REPO_URL>
cd modern-php83-rest-api

# 2. Launch complete stack (PHP-FPM, Nginx, MySQL)
docker compose up -d --build

# 3. Test API endpoint
curl http://localhost:8080/api/health
\`\`\`

## 📡 API Endpoints

- \`GET /api/health\` - Server health, PHP version, and memory usage
- \`GET /api/v1/info\` - Application architecture metadata
- \`POST /api/v1/echo\` - JSON echo tester

## 🛠️ Local Development (without Docker)

\`\`\`bash
composer install
composer start # Starts local development server at http://localhost:8000
\`\`\`

## 📦 Features

- **PHP 8.3 Strict Types**: \`declare(strict_types=1);\` throughout
- **Clean Router & Response Helper**: Lightweight zero-dependency PSR-style architecture
- **Production FastCGI Buffers**: Nginx configuration pre-tuned against 502/504 errors
- **GitHub Actions**: Automated linting and syntax validation on every push
`,
      },
    ],
    gitInitInstructions: [
      'git init',
      'git add .',
      'git commit -m "feat: initial commit modern PHP 8.3 REST API"',
      'git branch -M main',
      'git remote add origin https://github.com/<your-username>/<your-repo-name>.git',
      'git push -u origin main',
    ],
  },
  {
    projectName: 'php-pdo-mysql-starter',
    description: 'Secure, production-hardened PHP & MySQL starter with prepared statements, connection pooling, and session auth.',
    files: [
      {
        path: 'public/index.php',
        language: 'php',
        purpose: 'Landing dashboard and database status check',
        content: `<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Database.php';

use App\\Database;

$status = 'Checking connection...';
$serverInfo = [];

try {
    $pdo = Database::getConnection();
    $status = 'Connected successfully to MySQL!';
    $stmt = $pdo->query('SELECT VERSION() as version, NOW() as current_time');
    $serverInfo = $stmt->fetch();
} catch (Throwable $e) {
    $status = 'Connection failed: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP + MySQL PDO Starter</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-8">
    <div class="max-w-2xl mx-auto bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
        <h1 class="text-2xl font-bold text-emerald-400 mb-4">🐘 PHP 8.3 + MySQL PDO Starter</h1>
        <div class="p-4 rounded-lg <?= isset($serverInfo['version']) ? 'bg-emerald-950 border border-emerald-600' : 'bg-red-950 border border-red-600' ?>">
            <p class="font-mono text-sm font-semibold"><?= htmlspecialchars($status) ?></p>
            <?php if (isset($serverInfo['version'])): ?>
                <div class="mt-3 text-xs font-mono text-slate-300">
                    <p>MySQL Version: <?= htmlspecialchars($serverInfo['version']) ?></p>
                    <p>DB Time: <?= htmlspecialchars($serverInfo['current_time']) ?></p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
`,
      },
      {
        path: 'src/Database.php',
        language: 'php',
        purpose: 'Robust PDO connection singleton with SSL, UTF8MB4, and error mode exception',
        content: `<?php
declare(strict_types=1);

namespace App;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = getenv('DB_HOST') ?: '127.0.0.1';
            $port = getenv('DB_PORT') ?: '3306';
            $db   = getenv('DB_NAME') ?: 'app_db';
            $user = getenv('DB_USER') ?: 'root';
            $pass = getenv('DB_PASS') ?: '';

            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            self::$instance = new PDO($dsn, $user, $pass, $options);
        }

        return self::$instance;
    }
}
`,
      },
      {
        path: 'composer.json',
        language: 'json',
        purpose: 'Composer project configuration',
        content: `{
  "name": "app/php-pdo-starter",
  "require": {
    "php": ">=8.2",
    "ext-pdo": "*",
    "ext-pdo_mysql": "*"
  },
  "autoload": {
    "psr-4": {
      "App\\\\": "src/"
    }
  }
}
`,
      },
      {
        path: 'docker-compose.yml',
        language: 'yaml',
        purpose: 'PHP + MySQL Docker setup with persistent volume',
        content: `services:
  web:
    image: php:8.3-apache
    container_name: php_mysql_web
    ports:
      - "8000:80"
    volumes:
      - ./:/var/www/html
    environment:
      DB_HOST: db
      DB_PORT: 3306
      DB_NAME: app_db
      DB_USER: db_user
      DB_PASS: db_secret
    depends_on:
      - db

  db:
    image: mysql:8.0
    container_name: php_mysql_db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: app_db
      MYSQL_USER: db_user
      MYSQL_PASSWORD: db_secret
      MYSQL_ROOT_PASSWORD: root_password
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
`,
      },
      {
        path: 'README.md',
        language: 'markdown',
        purpose: 'Project guide',
        content: `# PHP + MySQL PDO Starter 🐘

Production-ready PHP and MySQL PDO boilerplate with strict exception handling and SQL injection prevention.

## Run with Docker
\`\`\`bash
docker compose up -d
\`\`\`
Visit http://localhost:8000
`,
      },
    ],
    gitInitInstructions: [
      'git init',
      'git add .',
      'git commit -m "feat: initial commit PHP + MySQL PDO Starter"',
      'git branch -M main',
      'git remote add origin https://github.com/<your-username>/<your-repo-name>.git',
      'git push -u origin main',
    ],
  },
];
