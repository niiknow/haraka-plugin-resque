[![CI Test Status][ci-img]][ci-url]
[![Code Climate][clim-img]][clim-url]

[![NPM][npm-img]][npm-url]

# haraka-plugin-resque


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
