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
        # Missing buffer tuning and permission alignment
    }
}`,
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
use PDOException;

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
  },
];
