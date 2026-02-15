# 🔒 Sicherheitshinweise

## ⚠️ KRITISCHE WARNUNG

**Diese Anwendung ist NUR für lokale, private Nutzung gedacht!**

## 🚨 Warum NICHT öffentlich deployen?

### 1. Open Proxy / SSRF-Schwachstelle

Die `proxy.php` akzeptiert **beliebige URLs** ohne Einschränkungen:

```php
// GEFAHR: Keine URL-Validierung
$url = $_GET['url'];  // Jede URL wird akzeptiert!
```

**Mögliche Angriffe:**
- Zugriff auf interne Dienste: `http://localhost:3306` (MySQL)
- Zugriff auf Metadaten-Server: `http://169.254.169.254` (AWS, Azure)
- Zugriff auf interne Netzwerke: `http://192.168.1.1`
- Datei-Zugriff: `file:///etc/passwd`

### 2. DDoS-Amplifikation

Angreifer können deinen Server nutzen um:
- Andere Server zu attackieren
- Bandbreite zu verschwenden
- Deinen Server als Teil eines Botnets zu missbrauchen

### 3. Keine Authentifizierung

- Jeder kann die API nutzen
- Keine Zugangskontrolle
- Keine Audit-Logs

### 4. Keine Rate-Limits

- Unbegrenzte Anfragen möglich
- Server-Ressourcen können erschöpft werden
- Kosten können explodieren (bei Cloud-Hosting)

### 5. SSL-Verification deaktiviert

```php
CURLOPT_SSL_VERIFYPEER => false,
CURLOPT_SSL_VERIFYHOST => false,
```

- Ermöglicht Man-in-the-Middle Angriffe
- Unsichere Verbindungen werden akzeptiert
- Zertifikats-Fehler werden ignoriert

### 6. Cookie-Handling

- Temporäre Cookie-Dateien werden erstellt
- Können bei Race-Conditions kollidieren
- Potentielles Information Disclosure

---

## ✅ Sichere Nutzung

### Nur für lokale Entwicklung

```bash
# ✅ SICHER: Lokaler Server
php -S localhost:8088

# ✅ SICHER: Nur auf Loopback-Interface
php -S 127.0.0.1:8088
```

### NICHT öffentlich exponieren

```bash
# ❌ UNSICHER: Öffentlich erreichbar
php -S 0.0.0.0:8088

# ❌ UNSICHER: Auf Server-IP
php -S 192.168.1.100:8088
```

---

## 🛡️ Was wäre nötig für Production?

Falls du die Anwendung wirklich öffentlich machen möchtest, sind **mindestens** folgende Absicherungen erforderlich:

### 1. URL-Whitelist

```php
$allowedDomains = [
    'amazon.de',
    'amazon.com',
    'thalia.de',
    // ... nur vertrauenswürdige Domains
];

$host = parse_url($url, PHP_URL_HOST);
if (!in_array($host, $allowedDomains)) {
    die('Domain nicht erlaubt');
}
```

### 2. Interne IP-Blockierung

```php
// Block localhost, private networks, link-local
$ip = gethostbyname($host);
if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
    die('Interne IPs nicht erlaubt');
}
```

### 3. Rate-Limiting

```php
// Pro IP: Max 10 Requests pro Minute
$redis = new Redis();
$key = 'rate_limit:' . $_SERVER['REMOTE_ADDR'];
$count = $redis->incr($key);
if ($count > 10) {
    http_response_code(429);
    die('Zu viele Anfragen');
}
$redis->expire($key, 60);
```

### 4. Authentifizierung

```php
$apiKey = $_GET['key'] ?? '';
$validKeys = getenv('VALID_API_KEYS'); // Aus Umgebungsvariable

if (!in_array($apiKey, explode(',', $validKeys))) {
    http_response_code(401);
    die('Unauthorized');
}
```

### 5. SSL-Verification aktivieren

```php
CURLOPT_SSL_VERIFYPEER => true,
CURLOPT_SSL_VERIFYHOST => 2,
```

### 6. Request-Size Limits

```php
// Max 5 MB Response
curl_setopt($ch, CURLOPT_BUFFERSIZE, 5 * 1024 * 1024);
```

### 7. Logging & Monitoring

```php
// Log alle Requests
error_log(sprintf(
    "[PROXY] IP: %s, URL: %s, Time: %s",
    $_SERVER['REMOTE_ADDR'],
    $url,
    date('Y-m-d H:i:s')
));
```

### 8. CORS-Einschränkungen

```php
// Statt '*' nur spezifische Domains
$allowedOrigins = ['https://yourdomain.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
```

---

## 📋 Checkliste vor Deployment

**Wenn alle Punkte erfüllt sind, kannst du erwägen, öffentlich zu deployen:**

- [ ] URL-Whitelist implementiert
- [ ] Interne IP-Blockierung implementiert
- [ ] Rate-Limiting (IP-basiert) implementiert
- [ ] API-Key oder OAuth Authentifizierung
- [ ] SSL-Verification aktiviert
- [ ] Request-Size Limits gesetzt
- [ ] Umfassendes Logging implementiert
- [ ] Monitoring & Alerting eingerichtet
- [ ] CORS auf spezifische Domains beschränkt
- [ ] Regelmäßige Security-Audits geplant
- [ ] WAF (Web Application Firewall) konfiguriert
- [ ] DDoS-Protection aktiv

**Wenn NICHT alle Punkte erfüllt:** ❌ **NICHT DEPLOYEN!**

---

## 🎯 Empfehlung

Für den vorgesehenen Use-Case (persönliche Geschenklisten erstellen) ist **lokale Nutzung völlig ausreichend**.

**Nutze die Anwendung:**
- Auf deinem lokalen Rechner
- Mit `php -S localhost:8088`
- Im Browser: `http://localhost:8088`

**Das ist:**
- ✅ Sicher
- ✅ Einfach
- ✅ Ausreichend für den Zweck
- ✅ Kostenlos

---

## 📞 Support

Bei Fragen zur Sicherheit oder falls du die Anwendung wirklich öffentlich machen musst, konsultiere einen Security-Experten.

**Diese README ist keine Rechtsberatung. Nutze die Software auf eigene Verantwortung.**

