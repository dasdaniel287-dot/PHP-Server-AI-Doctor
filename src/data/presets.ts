import { PresetProblem } from '../types';

export const PRESET_PROBLEMS: PresetProblem[] = [
  {
    id: 'memory-exhausted',
    name: '500 Fatal: Memory Limit (128M) Exhausted in Data Export',
    badge: '500 Fatal Error',
    category: 'Memory & Limits',
    quickDescription: 'Allowed memory size of 134217728 bytes exhausted during large JSON/CSV generation.',
    environment: 'Ubuntu 22.04 LTS / Docker',
    serverType: 'Nginx + PHP-FPM',
    phpVersion: 'PHP 8.3',
    targetFileName: 'export.php',
    errorLog: `[26-Oct-2026 14:22:09 UTC] PHP Fatal error:  Allowed memory size of 134217728 bytes exhausted (tried to allocate 33554440 bytes) in /var/www/html/export.php on line 42
Stack trace:
#0 /var/www/html/export.php(42): json_decode('...')
#1 /var/www/html/public/index.php(18): handleExportRequest()
#2 {main}
thrown in /var/www/html/export.php on line 42
[error] 142#142: *1 FastCGI sent in stderr: "PHP message: PHP Fatal error: Allowed memory size of 134217728 bytes exhausted" while reading response header from upstream, client: 192.168.1.50, server: example.com, request: "GET /api/export-orders HTTP/1.1", upstream: "fastcgi://unix:/run/php/php8.3-fpm.sock:", host: "example.com"`,
    codeSnippet: `<?php
// Flawed memory intensive script
function exportLargeDataSet() {
    // Current default memory_limit in php.ini is 128M
    $rows = [];
    for ($i = 0; $i < 250000; $i++) {
        $rows[] = [
            'id' => $i,
            'uuid' => bin2hex(random_bytes(16)),
            'payload' => str_repeat('Data payload chunk for customer records ', 20),
            'timestamp' => date('Y-m-d H:i:s'),
        ];
    }
    header('Content-Type: application/json');
    echo json_encode($rows);
}

exportLargeDataSet();`,
    solution: {
      title: 'PHP Fatal: Allowed Memory Size (128M) Exhausted in Data Processing',
      severity: 'Critical (500 Internal Server Error)',
      affectedComponent: 'php.ini / PHP-FPM Resource Limits',
      summary: 'The PHP execution process exceeded the default 128MB memory limit while accumulating 250,000 array elements in RAM before output.',
      rootCause: 'Default php.ini memory_limit is 128M. Generating massive JSON payloads into a single PHP array loads hundreds of megabytes into memory at once, triggering an out-of-memory fatal error.',
      oneClickFix: {
        fixName: 'Increase memory_limit to 512M and stream large datasets chunk-by-chunk',
        targetFileName: 'export.php',
        fixedContent: `<?php
declare(strict_types=1);

// Production-ready streamed export with optimized memory footprint
function exportLargeDataSetStream(): void {
    // Elevate memory limit and execution timeout safely for export worker
    ini_set('memory_limit', '512M');
    set_time_limit(180);

    header('Content-Type: application/json; charset=utf-8');
    header('X-Accel-Buffering: no'); // Disable FastCGI buffering for true streaming
    
    echo '[';
    // Chunked generator keeps RAM usage constant under 18MB
    for ($i = 0; $i < 250000; $i++) {
        $record = [
            'id' => $i,
            'uuid' => bin2hex(random_bytes(16)),
            'payload' => 'Data chunk for record ' . $i,
            'timestamp' => date('Y-m-d H:i:s'),
        ];
        echo json_encode($record, JSON_UNESCAPED_SLASHES);
        if ($i < 249999) {
            echo ',';
        }
        if ($i % 5000 === 0) {
            flush(); // Flush buffer to client periodically
        }
    }
    echo ']';
}

exportLargeDataSetStream();`,
        diffExplanation: 'Replaced monolithic in-memory array accumulation with streamed chunked JSON, and raised memory_limit to 512M.',
        terminalCommands: [
          "sudo sed -i 's/^memory_limit = .*/memory_limit = 512M/' /etc/php/8.3/fpm/php.ini",
          'sudo systemctl restart php8.3-fpm',
          'sudo nginx -t && sudo systemctl reload nginx',
        ],
        configSnippet: 'memory_limit = 512M\nmax_execution_time = 180',
      },
      preventionTips: [
        'Use PHP yield generators for large database queries (e.g. PDO unbuffered queries or chunking).',
        'Configure memory_limit in php-fpm pool conf (php_admin_value[memory_limit] = 512M).',
        'Set up monitoring for OOM worker killed events in /var/log/php8.3-fpm.log.',
      ],
      verificationCheck: 'curl -I http://localhost/api/export-orders # Expect HTTP 200 OK',
    },
  },
  {
    id: 'fpm-sock-permission',
    name: '502 Bad Gateway: PHP-FPM Socket Connect Refused',
    badge: '502 Bad Gateway',
    category: 'PHP-FPM',
    quickDescription: 'Nginx cannot communicate with php-fpm unix socket due to missing socket file or permissions.',
    environment: 'Ubuntu Linux VPS',
    serverType: 'Nginx + PHP-FPM',
    phpVersion: 'PHP 8.3',
    targetFileName: '/etc/nginx/sites-available/default',
    errorLog: `2026/10/26 14:15:32 [crit] 18492#18492: *4 connect() to unix:/var/run/php/php8.3-fpm.sock failed (13: Permission denied) while connecting to upstream, client: 172.56.21.9, server: app.mycorp.com, request: "GET /index.php HTTP/1.1", upstream: "fastcgi://unix:/var/run/php/php8.3-fpm.sock:", host: "app.mycorp.com"
systemctl status php8.3-fpm:
● php8.3-fpm.service - The PHP 8.3 FastCGI Process Manager
     Active: active (running)
     Socket: /var/run/php/php8.3-fpm.sock
     Owner: root:root (Should be www-data:www-data with mode 0660)`,
    codeSnippet: `server {
    listen 80;
    server_name app.mycorp.com;
    root /var/www/app/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Flawed FastCGI configuration
    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }
}`,
    solution: {
      title: '502 Bad Gateway: PHP-FPM Unix Socket Permission Denied',
      severity: 'Critical (502 Bad Gateway)',
      affectedComponent: 'PHP-FPM Pool / Unix Socket Permissions',
      summary: 'Nginx worker process (running as www-data) cannot read/write to /var/run/php/php8.3-fpm.sock due to restrictive permissions.',
      rootCause: 'The PHP-FPM unix socket was created with root:root ownership and 0600 mode instead of www-data:www-data mode 0660.',
      oneClickFix: {
        fixName: 'Align listen.owner, listen.group, and listen.mode in www.conf',
        targetFileName: '/etc/php/8.3/fpm/pool.d/www.conf',
        fixedContent: `[www]
user = www-data
group = www-data

listen = /var/run/php/php8.3-fpm.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35`,
        diffExplanation: 'Configured listen.owner = www-data, listen.group = www-data, and listen.mode = 0660 so Nginx can access the FastCGI socket.',
        terminalCommands: [
          'sudo chown www-data:www-data /var/run/php/php8.3-fpm.sock',
          'sudo chmod 660 /var/run/php/php8.3-fpm.sock',
          'sudo systemctl restart php8.3-fpm',
          'sudo nginx -t && sudo systemctl reload nginx',
        ],
        configSnippet: 'listen.owner = www-data\nlisten.group = www-data\nlisten.mode = 0660',
      },
      preventionTips: [
        'Ensure www.conf listen.owner matches the user defined at the top of nginx.conf.',
        'Avoid creating socket files in /tmp if systemd PrivateTmp=true is enabled.',
      ],
      verificationCheck: 'sudo ls -la /var/run/php/php8.3-fpm.sock # Verify srw-rw---- www-data www-data',
    },
  },
  {
    id: 'pdo-mysql-refused',
    name: 'Fatal PDOException: SQLSTATE[HY000] [2002] Connection Refused',
    badge: 'Database PDO',
    category: 'Database/PDO',
    quickDescription: 'PHP script fails to connect to MySQL in Docker container due to localhost vs db hostname.',
    environment: 'Docker Compose (PHP + MySQL)',
    serverType: 'Docker PHP-FPM',
    phpVersion: 'PHP 8.3',
    targetFileName: 'config/database.php',
    errorLog: `Fatal error: Uncaught PDOException: SQLSTATE[HY000] [2002] Connection refused in /var/www/html/src/Database.php:15
Stack trace:
#0 /var/www/html/src/Database.php(15): PDO->__construct('mysql:host=127....', 'root', 'secret123', Array)
#1 /var/www/html/public/index.php(8): App\\Database::connect()
#2 {main}
  thrown in /var/www/html/src/Database.php on line 15`,
    codeSnippet: `<?php
namespace App;

use PDO;

class Database {
    public static function connect(): PDO {
        // ERROR: Inside Docker container, 127.0.0.1 points to the PHP container itself,
        // not the MySQL container service ('db') on the docker bridge network!
        $dsn = "mysql:host=127.0.0.1;port=3306;dbname=production_app;charset=utf8mb4";
        $user = "root";
        $password = "secret123";

        return new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
}`,
    solution: {
      title: 'Fatal PDOException: Connection Refused inside Docker Network',
      severity: 'Critical (Database Down)',
      affectedComponent: 'PDO MySQL / Docker Networking',
      summary: 'PHP tried to connect to MySQL on 127.0.0.1 inside a Docker container, where MySQL runs on a separate container host ("db").',
      rootCause: 'Inside Docker Compose bridge networks, each container has its own localhost (127.0.0.1). Services must connect via the service name (e.g. host=db or DB_HOST env var).',
      oneClickFix: {
        fixName: 'Dynamic host resolution via getenv("DB_HOST") ?: "db"',
        targetFileName: 'config/database.php',
        fixedContent: `<?php
namespace App;

use PDO;
use PDOException;

class Database {
    public static function connect(): PDO {
        // Use environment variable with fallback to Docker service hostname 'db'
        $host = getenv('DB_HOST') ?: 'db';
        $port = getenv('DB_PORT') ?: '3306';
        $db   = getenv('DB_NAME') ?: 'production_app';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: 'secret123';

        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";

        return new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
}`,
        diffExplanation: 'Replaced hardcoded 127.0.0.1 with dynamic environment lookup defaulting to Docker service name "db".',
        terminalCommands: [
          'docker compose up -d db',
          'docker compose exec app php -r "require \'config/database.php\'; App\\Database::connect(); echo \'DB Connected!\n\';"',
        ],
        configSnippet: 'DB_HOST=db\nDB_PORT=3306\nDB_NAME=production_app',
      },
      preventionTips: [
        'Always read database connection coordinates from environment variables (12-Factor App methodology).',
        'Verify both containers share the same network in docker-compose.yml.',
      ],
      verificationCheck: 'docker compose exec app php -m | grep pdo_mysql',
    },
  },
  {
    id: 'headers-already-sent',
    name: 'Warning: Cannot Modify Header Information - Headers Already Sent',
    badge: 'Header Issue',
    category: 'Headers & Output',
    quickDescription: 'Unexpected whitespace or UTF-8 BOM before <?php tag blocks session_start and redirect.',
    environment: 'cPanel / Apache / PHP',
    serverType: 'Apache mod_php',
    phpVersion: 'PHP 8.2',
    targetFileName: 'auth/login.php',
    errorLog: `[26-Oct-2026 15:02:11 UTC] PHP Warning:  Cannot modify header information - headers already sent by (output started at /home/user/public_html/auth/config.php:1) in /home/user/public_html/auth/login.php on line 12
[26-Oct-2026 15:02:11 UTC] PHP Warning:  session_start(): Cannot start session when headers already sent in /home/user/public_html/auth/login.php on line 4`,
    codeSnippet: `  <?php
// Note the 2 whitespace characters before the opening <?php tag above!
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = $_POST['user'] ?? '';
    if ($user === 'admin') {
        $_SESSION['authenticated'] = true;
        // Fails with "headers already sent"
        header('Location: /dashboard.php');
        exit;
    }
}
?>`,
    solution: {
      title: 'PHP Warning: Headers Already Sent by Preceding Whitespace or UTF-8 BOM',
      severity: 'Warning / Session Failure',
      affectedComponent: 'PHP Output Buffering & Header Pipeline',
      summary: 'Output buffering started prematurely because invisible leading whitespace existed before the opening <?php tag.',
      rootCause: 'HTTP headers (including Set-Cookie for sessions and Location redirects) must precede any response body. Whitespace sent early causes PHP to seal headers immediately.',
      oneClickFix: {
        fixName: 'Remove leading whitespace, enable ob_start(), and omit closing ?> tag',
        targetFileName: 'auth/login.php',
        fixedContent: `<?php
declare(strict_types=1);

// Enable output buffering to prevent header conflicts
ob_start();

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = $_POST['user'] ?? '';
    if ($user === 'admin') {
        $_SESSION['authenticated'] = true;
        header('Location: /dashboard.php');
        exit;
    }
}
// Note: Omit closing ?> tag per PSR-12 standard to prevent accidental trailing whitespace`,
        diffExplanation: 'Removed leading whitespace, wrapped with ob_start(), added session_status check, and stripped closing PHP tag.',
        terminalCommands: [
          "sed -i '1s/^\\s*//' auth/login.php",
          'php -l auth/login.php',
        ],
        configSnippet: 'output_buffering = 4096',
      },
      preventionTips: [
        'Never include a closing ?> tag in pure PHP files (PSR-12 standard).',
        'Ensure your text editor saves files as UTF-8 without BOM (Byte Order Mark).',
      ],
    },
  },
  {
    id: 'curl-ssl-cainfo',
    name: 'cURL Error 60: SSL Certificate Problem (unable to get local issuer)',
    badge: 'cURL / SSL',
    category: 'SSL & cURL',
    quickDescription: 'cURL fails external HTTPS requests (Stripe, GitHub API, Webhooks) because curl.cainfo is unset.',
    environment: 'Windows / XAMPP / Ubuntu Docker',
    serverType: 'Apache / PHP 8.3',
    phpVersion: 'PHP 8.3',
    targetFileName: 'php.ini',
    errorLog: `Fatal error: Uncaught GuzzleHttp\\Exception\\RequestException: cURL error 60: SSL certificate problem: unable to get local issuer certificate (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) for https://api.stripe.com/v1/charges
Stack trace:
#0 /var/www/html/vendor/guzzlehttp/guzzle/src/Handler/CurlHandler.php(40): GuzzleHttp\\Exception\\RequestException::wrapException(...)
#1 /var/www/html/src/PaymentService.php(28): GuzzleHttp\\Client->send(...)`,
    codeSnippet: `; php.ini configuration snippet
; [curl]
; A default value for the CURLOPT_CAINFO option. This is required
; to be an absolute path.
; curl.cainfo = 

; [openssl]
; The location of a Certificate Authority (CA) file on the local machine
; openssl.cafile = `,
    solution: {
      title: 'cURL Error 60: SSL Certificate Problem (unable to get local issuer certificate)',
      severity: 'Critical (Outbound API Failure)',
      affectedComponent: 'php.ini / OpenSSL CA Bundle (curl.cainfo)',
      summary: 'PHP cannot verify TLS/SSL certificates of external APIs (Stripe, PayPal, GitHub, AWS) due to missing CA bundle.',
      rootCause: 'cURL relies on a Certificate Authority (CA) cert bundle to verify HTTPS remote hosts. In Windows/XAMPP or minimal Linux, curl.cainfo is empty.',
      oneClickFix: {
        fixName: 'Download official Mozilla cacert.pem and configure curl.cainfo in php.ini',
        targetFileName: 'php.ini',
        fixedContent: `[curl]
curl.cainfo = "/etc/ssl/certs/cacert.pem"

[openssl]
openssl.cafile = "/etc/ssl/certs/cacert.pem"`,
        diffExplanation: 'Configured curl.cainfo and openssl.cafile to point to the system root certificates bundle.',
        terminalCommands: [
          'sudo apt-get update && sudo apt-get install -y ca-certificates',
          'sudo curl -sS https://curl.se/ca/cacert.pem -o /etc/ssl/certs/cacert.pem',
          "sudo sed -i 's|;curl.cainfo =.*|curl.cainfo = \"/etc/ssl/certs/cacert.pem\"|' /etc/php/8.3/fpm/php.ini",
          'sudo systemctl restart php8.3-fpm',
        ],
        configSnippet: 'curl.cainfo = "/etc/ssl/certs/cacert.pem"\nopenssl.cafile = "/etc/ssl/certs/cacert.pem"',
      },
      preventionTips: [
        'Run update-ca-certificates on Ubuntu/Debian periodically.',
        'Never disable CURLOPT_SSL_VERIFYPEER in production as it leaves transactions vulnerable to MITM attacks.',
      ],
    },
  },
  {
    id: 'laravel-key-permissions',
    name: 'Laravel 500: No Application Encryption Key / Storage Permission Denied',
    badge: 'Laravel 11',
    category: 'Laravel/WP',
    quickDescription: 'Laravel throws 500 error due to missing APP_KEY and 755 permission denied on storage/logs.',
    environment: 'Production Linux VPS',
    serverType: 'Nginx + PHP-FPM',
    phpVersion: 'PHP 8.3',
    targetFileName: '.env',
    errorLog: `production.ERROR: No application encryption key has been specified. {"exception":"[object] (Illuminate\\\\Encryption\\\\MissingAppKeyException(code: 0): No application encryption key has been specified. at /var/www/laravel/vendor/laravel/framework/src/Illuminate/Encryption/EncryptionServiceProvider.php:83)
[2026-10-26 15:30:00] production.ERROR: UnexpectedValueException: The stream or file "/var/www/laravel/storage/logs/laravel.log" could not be opened in append mode: Failed to open stream: Permission denied in /var/www/laravel/vendor/monolog/monolog/src/Monolog/Handler/StreamHandler.php:146`,
    codeSnippet: `APP_NAME=LaravelApp
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://my-app.example.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel_prod
DB_USERNAME=laravel_user
DB_PASSWORD=`,
    solution: {
      title: 'Laravel 500: Missing APP_KEY & storage/logs Permission Denied',
      severity: 'Critical (Laravel 500)',
      affectedComponent: 'Laravel Environment & Linux File Ownership',
      summary: 'Laravel cannot boot because the encryption cipher has no secret key, and the web server user cannot write logs.',
      rootCause: 'Fresh deployments missing `php artisan key:generate` and storage/ + bootstrap/cache are owned by root rather than www-data.',
      oneClickFix: {
        fixName: 'Generate APP_KEY and adjust permissions to 775 with www-data ownership',
        targetFileName: '.env',
        fixedContent: `APP_NAME=LaravelApp
APP_ENV=production
APP_KEY=base64:9ZqB+F8zK2dM1xT3vQ4yN5rL8wX7pE0aB2c4D6e8F0g=
APP_DEBUG=false
APP_URL=https://my-app.example.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel_prod
DB_USERNAME=laravel_user
DB_PASSWORD=secret`,
        diffExplanation: 'Generated secure base64 AES-256 encryption key and prepared permissions for storage directory.',
        terminalCommands: [
          'php artisan key:generate',
          'sudo chown -R www-data:www-data storage bootstrap/cache',
          'sudo chmod -R 775 storage bootstrap/cache',
          'php artisan config:cache && php artisan route:cache',
        ],
      },
      preventionTips: [
        'Include `chown -R www-data:www-data storage bootstrap/cache` in your deployment script.',
        'Always run `php artisan config:cache` in production deployments.',
      ],
    },
  },
  {
    id: 'composer-missing-ext',
    name: 'Fatal Error: Class "PDO" Not Found / Missing PHP Extensions',
    badge: 'Composer/Ext',
    category: 'Composer',
    quickDescription: 'PHP docker image or minimal install lacks pdo_mysql, mbstring, and intl extensions.',
    environment: 'Docker php:8.3-fpm-alpine',
    serverType: 'Docker FPM',
    phpVersion: 'PHP 8.3',
    targetFileName: 'Dockerfile',
    errorLog: `PHP Fatal error:  Class "PDO" not found in /var/www/html/vendor/doctrine/dbal/src/Driver/PDO/MySQL/Driver.php on line 18
Composer error:
Your requirements could not be resolved to an installable set of packages.
  Problem 1
    - Root composer.json requires PHP extension ext-pdo_mysql * but it is missing from your system. Install or enable PHP's pdo_mysql extension.
    - Root composer.json requires PHP extension ext-intl * but it is missing from your system.`,
    codeSnippet: `# Flawed Dockerfile missing build dependencies and docker-php-ext-install
FROM php:8.3-fpm-alpine

WORKDIR /var/www/html

# Only copied files without installing extensions!
COPY . .

CMD ["php-fpm"]`,
    solution: {
      title: 'Fatal Error: Class "PDO" Not Found / Missing PHP Extensions',
      severity: 'Critical (Fatal Class Not Found)',
      affectedComponent: 'Docker Alpine PHP-FPM Extensions',
      summary: 'The Alpine container image does not compile or enable pdo_mysql, mbstring, or intl extensions.',
      rootCause: 'Official PHP Alpine images only ship with core PHP; database and multibyte extensions must be installed via docker-php-ext-install.',
      oneClickFix: {
        fixName: 'Install build dependencies and compile pdo, pdo_mysql, intl, and mbstring',
        targetFileName: 'Dockerfile',
        fixedContent: `FROM php:8.3-fpm-alpine

# Install build dependencies
RUN apk add --no-cache \\
    icu-dev \\
    oniguruma-dev \\
    curl \\
    libpng-dev \\
    git

# Install and enable required PHP extensions
RUN docker-php-ext-configure intl \\
    && docker-php-ext-install -j$(nproc) \\
        pdo \\
        pdo_mysql \\
        intl \\
        mbstring \\
        opcache

WORKDIR /var/www/html

COPY . .

RUN chown -R www-data:www-data /var/www/html

EXPOSE 9000

CMD ["php-fpm"]`,
        diffExplanation: 'Added apk dependencies and docker-php-ext-install commands for pdo, pdo_mysql, intl, and mbstring.',
        terminalCommands: [
          'docker compose build --no-cache app',
          'docker compose up -d app',
          'docker compose exec app php -m',
        ],
      },
      preventionTips: [
        'Verify required extensions before building with `composer check-platform-reqs`.',
        'Use multi-stage Docker builds to keep final production image lightweight.',
      ],
    },
  },
  {
    id: 'nginx-try-files',
    name: 'Nginx 404 Not Found on API Routes (Missing try_files)',
    badge: 'Nginx 404',
    category: 'Nginx/Apache',
    quickDescription: 'Frontend router or API requests return Nginx 404 instead of routing through /public/index.php.',
    environment: 'Linux Debian / Nginx',
    serverType: 'Nginx',
    phpVersion: 'PHP 8.3',
    targetFileName: '/etc/nginx/sites-available/api.conf',
    errorLog: `2026/10/26 16:10:45 [error] 2314#2314: *9 open() "/var/www/api/public/v1/users/login" failed (2: No such file or directory), client: 82.165.197.1, server: api.example.com, request: "POST /v1/users/login HTTP/1.1", host: "api.example.com"`,
    codeSnippet: `server {
    listen 80;
    server_name api.example.com;
    root /var/www/api/public;

    # Flawed: Nginx looks for a literal folder named /v1/users/login instead of index.php!
    location / {
        index index.php;
    }

    location ~ \\.php$ {
        include fastcgi_params;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}`,
    solution: {
      title: 'Nginx 404 Not Found on API Routes (Missing try_files)',
      severity: 'Configuration Error (404 Not Found)',
      affectedComponent: 'Nginx Location Block Routing',
      summary: 'Nginx treats API paths like /v1/users/login as literal disk files instead of passing them to front controller public/index.php.',
      rootCause: 'Without `try_files $uri $uri/ /index.php?$query_string;`, Nginx tries to open the path literally on the filesystem.',
      oneClickFix: {
        fixName: 'Add try_files directive to route all virtual paths through index.php',
        targetFileName: '/etc/nginx/sites-available/api.conf',
        fixedContent: `server {
    listen 80;
    server_name api.example.com;
    root /var/www/api/public;
    index index.php index.html;

    # Properly route all dynamic requests to front controller
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        include fastcgi_params;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
    }
}`,
        diffExplanation: 'Added `try_files $uri $uri/ /index.php?$query_string;` to route clean URLs into index.php.',
        terminalCommands: [
          'sudo nginx -t',
          'sudo systemctl reload nginx',
        ],
      },
      preventionTips: [
        'Always run `nginx -t` before reloading configuration in production.',
      ],
    },
  },
  {
    id: 'wordpress-critical-error',
    name: 'WordPress "There has been a critical error on this website"',
    badge: 'WP 500',
    category: 'Laravel/WP',
    quickDescription: 'White Screen of Death / Critical Error due to memory limit and faulty plugin hook.',
    environment: 'Apache / Shared cPanel',
    serverType: 'Apache mod_php',
    phpVersion: 'PHP 8.2',
    targetFileName: 'wp-config.php',
    errorLog: `Fatal error: Allowed memory size of 67108864 bytes exhausted (tried to allocate 20480 bytes) in /home/user/public_html/wp-includes/plugin.php on line 205
There has been a critical error on this website. Please check your site admin email inbox for instructions.`,
    codeSnippet: `<?php
// wp-config.php snippet
define( 'DB_NAME', 'wp_database' );
define( 'DB_USER', 'wp_user' );
define( 'DB_PASSWORD', 'password123' );
define( 'DB_HOST', 'localhost' );

// Debugging is currently disabled, concealing true error
define( 'WP_DEBUG', false );
// Default WP memory limit is only 40M / 64M!
/* That's all, stop editing! Happy publishing. */`,
    solution: {
      title: 'WordPress "Critical Error on this website" (WSOD)',
      severity: 'Critical (WordPress 500 Down)',
      affectedComponent: 'wp-config.php / WP_MEMORY_LIMIT',
      summary: 'WordPress ran out of memory (64MB) during plugin initialization, resulting in the generic critical error screen.',
      rootCause: 'Default WordPress memory allocation is only 40MB for frontend and 64MB for admin, insufficient for WooCommerce, Elementor, or heavy plugins.',
      oneClickFix: {
        fixName: 'Increase WP_MEMORY_LIMIT to 256M and enable WP_DEBUG_LOG',
        targetFileName: 'wp-config.php',
        fixedContent: `<?php
define( 'DB_NAME', 'wp_database' );
define( 'DB_USER', 'wp_user' );
define( 'DB_PASSWORD', 'password123' );
define( 'DB_HOST', 'localhost' );

// Increase WordPress Memory Limit
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );

// Safe error logging without exposing errors to site visitors
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
@ini_set( 'display_errors', 0 );

/* That's all, stop editing! Happy publishing. */`,
        diffExplanation: 'Elevated WP_MEMORY_LIMIT to 256M and configured private file logging to wp-content/debug.log.',
        terminalCommands: [
          "sudo sed -i \"/stop editing/i define( 'WP_MEMORY_LIMIT', '256M' );\" wp-config.php",
          'sudo service apache2 restart',
        ],
      },
      preventionTips: [
        'Check wp-content/debug.log for plugins triggering repeated memory allocation bursts.',
      ],
    },
  },
  {
    id: 'apache-htaccess-loop',
    name: 'Apache 500: Request exceeded limit of 10 internal redirects (RewriteRule loop)',
    badge: 'Apache 500',
    category: 'Nginx/Apache',
    quickDescription: 'Infinite redirect rewrite loop in .htaccess crashes Apache with HTTP 500.',
    environment: 'Ubuntu VPS / Apache 2.4',
    serverType: 'Apache mod_php',
    phpVersion: 'PHP 8.3',
    targetFileName: '.htaccess',
    errorLog: `[Sun Oct 26 16:42:01.819201 2026] [core:error] [pid 4912] [client 192.168.1.101:54201] AH00124: Request exceeded the limit of 10 internal redirects due to probable configuration error. Use 'LimitInternalRecursion' to increase the limit if necessary. Use 'LogLevel debug' to get a backtrace.`,
    codeSnippet: `<IfModule mod_rewrite.c>
    RewriteEngine On
    # Flawed: Missing RewriteCond %{REQUEST_FILENAME} !-f causing infinite recursion!
    RewriteRule ^(.*)$ index.php [L,QSA]
</IfModule>`,
    solution: {
      title: 'Apache 500: Request Exceeded Limit of 10 Internal Redirects',
      severity: 'Critical (Internal Server Error)',
      affectedComponent: 'Apache mod_rewrite / .htaccess',
      summary: 'Apache enters an infinite rewrite loop rewriting index.php to index.php until it exceeds the 10-redirect recursion limit.',
      rootCause: 'RewriteRule lacks conditions to exclude existing files and directories (`RewriteCond %{REQUEST_FILENAME} !-f`).',
      oneClickFix: {
        fixName: 'Add file and directory exclusion conditions before RewriteRule',
        targetFileName: '.htaccess',
        fixedContent: `<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Prevent loop by checking if requested target is already a physical file or folder
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L,QSA]
</IfModule>`,
        diffExplanation: 'Added RewriteCond !-f and !-d to protect physical assets and stop recursion.',
        terminalCommands: [
          'sudo a2enmod rewrite',
          'sudo systemctl restart apache2',
        ],
      },
      preventionTips: [
        'Always check RewriteCond !-f before single-entry router rules.',
      ],
    },
  },
  {
    id: 'php84-dynamic-property',
    name: 'PHP 8.4 Deprecated: Creation of Dynamic Property is Deprecated',
    badge: 'PHP 8.4',
    category: 'Headers & Output',
    quickDescription: 'PHP 8.4 fatal deprecation when assigning uninitialized properties to classes.',
    environment: 'Ubuntu 24.04 / PHP 8.4',
    serverType: 'Nginx + PHP-FPM',
    phpVersion: 'PHP 8.4',
    targetFileName: 'src/UserSession.php',
    errorLog: `Deprecated: Creation of dynamic property App\\UserSession::$jwtToken is deprecated in /var/www/html/src/UserSession.php on line 14
Deprecated: Creation of dynamic property App\\UserSession::$lastActive is deprecated in /var/www/html/src/UserSession.php on line 15`,
    codeSnippet: `<?php
namespace App;

// Missing #[\AllowDynamicProperties] or declared class properties
class UserSession {
    public function __construct(string $username) {
        $this->username = $username;
        $this->jwtToken = bin2hex(random_bytes(32));
        $this->lastActive = time();
    }
}`,
    solution: {
      title: 'PHP 8.4 Deprecated: Creation of Dynamic Property is Deprecated',
      severity: 'Warning / Strict Exception',
      affectedComponent: 'PHP 8.4 Strict OOP / Class Properties',
      summary: 'PHP 8.2+ deprecates and PHP 8.4+ restricts dynamic undeclared properties, throwing exceptions in strict frameworks.',
      rootCause: 'Properties `$username`, `$jwtToken`, and `$lastActive` were assigned without prior declaration on the class.',
      oneClickFix: {
        fixName: 'Declare typed class properties or add #[\AllowDynamicProperties]',
        targetFileName: 'src/UserSession.php',
        fixedContent: `<?php
declare(strict_types=1);

namespace App;

class UserSession {
    public string $username;
    public string $jwtToken;
    public int $lastActive;

    public function __construct(string $username) {
        $this->username = $username;
        $this->jwtToken = bin2hex(random_bytes(32));
        $this->lastActive = time();
    }
}`,
        diffExplanation: 'Declared typed class properties `public string $username`, `public string $jwtToken`, and `public int $lastActive`.',
        terminalCommands: [
          'php -l src/UserSession.php',
        ],
      },
      preventionTips: [
        'Declare all class properties explicitly with strict types.',
        'Use #[\AllowDynamicProperties] attribute only as temporary bridge for legacy code.',
      ],
    },
  },
];
