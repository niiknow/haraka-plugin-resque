[![CI Test Status][ci-img]][ci-url]
[![Code Climate][clim-img]][clim-url]

[![NPM][npm-img]][npm-url]

# haraka-plugin-resque


# NOTE
This plugin uses the global `fetch` function, which only available with nodejs >= 18.  As of the writing of this plugin, nodejs 16 has already reached its end-of-life anyway.

# Ideal Setup
You're a SASS Provider (such as form submission like Wufoo) requiring to send email on-behalf-of client.

SMTP -> Haraka -> API -> REAL SMTP using a different email sends on behalf of

1.  Using an existing software, you want to use SMTP to send email; so we setup Haraka with auth flat_file plugin allowing you to login.

```sh
echo "tls
auth/flat_file" > config/plugins
vi config/auth_flat_file.ini
```
Ref: https://haraka.github.io/plugins/auth/flat_file

2.  This plugin pushes your email to the API.

```sh
cd /path/to/local/haraka
npm install haraka-plugin-resque
echo "resque" >> config/plugins
service haraka restart
```

3.  This plugin blackhole all outgoing email.

Edit `outbound.ini` https://haraka.github.io/core/Outbound#outboundini
And disable outbound with:
```
; see http://haraka.github.io/manual/Outbound.html
;
; disabled (default: false)
disabled=true
```

More info: https://dzone.com/articles/creating-your-own-e-mail-service-with-haraka-postg
https://github.com/haraka/Haraka/issues/20

# Add your content here

## INSTALL

```sh
cd /path/to/local/haraka
npm install haraka-plugin-resque
echo "resque" >> config/plugins
service haraka restart
```

### Configuration

If the default configuration is not sufficient, copy the config file from the distribution into your haraka config dir and then modify it:

```sh
cp node_modules/haraka-plugin-resque/config/resque.ini config/resque.ini
$EDITOR config/resque.ini
```

## USAGE


<!-- leave these buried at the bottom of the document -->
[ci-img]: https://github.com/haraka/haraka-plugin-resque/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/haraka/haraka-plugin-resque/actions/workflows/ci.yml
[clim-img]: https://codeclimate.com/github/haraka/haraka-plugin-resque/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-plugin-resque
[npm-img]: https://nodei.co/npm/haraka-plugin-resque.png
[npm-url]: https://www.npmjs.com/package/haraka-plugin-resque
