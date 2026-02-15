# Troubleshooting 502 Bad Gateway Error

## Was bedeutet der 502 Fehler?

Ein 502 Bad Gateway Fehler bedeutet, dass der Webserver (z.B. Nginx/Apache) nicht mit dem PHP-Backend kommunizieren kann.

## Häufige Ursachen und Lösungen:

### 1. PHP-FPM läuft nicht

**Lösung:**
```bash
# Status prüfen
sudo systemctl status php-fpm
# oder für spezifische PHP Version:
sudo systemctl status php8.3-fpm

# Starten falls nötig:
sudo systemctl start php8.3-fpm
```

### 2. Falsche Socket-Konfiguration

**Nginx Konfiguration prüfen:**
```nginx
location ~ \.php$ {
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    # ODER für TCP:
    # fastcgi_pass 127.0.0.1:9000;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

**Socket-Datei prüfen:**
```bash
ls -la /run/php/php*-fpm.sock
```

### 3. PHP Built-in Server verwenden (für Development)

Wenn du keinen richtigen Webserver konfiguriert hast:

```bash
cd /home/temme/Projekte/Privat/linkList/opengraph
php -S localhost:8088
```

Dann im Browser öffnen: `http://localhost:8088/index.html`

### 4. Apache/Nginx Logs prüfen

```bash
# Nginx Error Log:
sudo tail -f /var/log/nginx/error.log

# Apache Error Log:
sudo tail -f /var/log/apache2/error.log

# PHP-FPM Log:
sudo tail -f /var/log/php8.3-fpm.log
```

### 5. Dateiberechtigungen prüfen

```bash
# Stelle sicher, dass der Webserver die Dateien lesen kann:
chmod 644 /home/temme/Projekte/Privat/linkList/opengraph/*.php
chmod 755 /home/temme/Projekte/Privat/linkList/opengraph/
```

### 6. cURL ist nicht installiert

```bash
# Prüfen ob cURL verfügbar ist:
php -m | grep curl

# Falls nicht installiert:
sudo apt install php-curl
# oder für spezifische Version:
sudo apt install php8.3-curl

# PHP-FPM danach neustarten:
sudo systemctl restart php8.3-fpm
```

## Schnelltest

Teste ob die proxy.php grundsätzlich funktioniert:

```bash
cd /home/temme/Projekte/Privat/linkList/opengraph
php proxy.php 2>&1
```

Oder mit einer Test-URL:

```bash
php -r '$_GET["url"]="https://example.com"; $_SERVER["REQUEST_METHOD"]="GET"; include "proxy.php";'
```

## Für Production: Webserver Setup

### Nginx Beispiel-Konfiguration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /home/temme/Projekte/Privat/linkList/opengraph;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
}
```

### Apache Beispiel-Konfiguration (.htaccess):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
</IfModule>

<FilesMatch \.php$>
    SetHandler application/x-httpd-php
</FilesMatch>
```

## Development vs. Production

**Development (einfach):**
- PHP Built-in Server: `php -S localhost:8088`
- Gut für Tests, nicht für Production!

**Production (empfohlen):**
- Nginx + PHP-FPM
- Apache + mod_php
- Bessere Performance und Sicherheit

