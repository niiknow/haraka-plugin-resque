[![NPM][npm-img]][npm-url]

# haraka-plugin-resque
Haraka plugin that act as a queue and perform REST post to a remote url.

# Ideal Setup
You're a SASS Provider (such as form submission like Wufoo) requiring to send email on-behalf-of client.

### Configuration

If the default configuration is not sufficient, copy the config file from the distribution into your haraka config dir and then modify it:

```sh
cp node_modules/haraka-plugin-resque/config/resque.ini config/resque.ini
$EDITOR config/resque.ini
```

## USAGE

SMTP-Client -> Haraka -> API -> Working-SMTP Server - using a different email sends on-behalf-of/sends-as client.

1.  Using an existing software, you want to use SMTP to send email; so we setup Haraka with auth flat_file plugin allowing you to login.

```sh
echo "tls
auth/flat_file" > config/plugins
vi config/auth_flat_file.ini
```
Ref: https://haraka.github.io/plugins/auth/flat_file

2.  This plugin pushes your email to a REST API.

```sh
cd /path/to/local/haraka
npm install haraka-plugin-resque

# you should disable the default/dummy smtp_forward plugin
sed -i -e 's,^queue/smtp_forward,#queue/smtp_forward,' config/plugins

# this enable resque, if it's not already in config/plugins folder
grep -qxF 'resque' config/plugins || echo "resque" >> config/plugins

# now restart haraka
service haraka restart
```

# But what is this Sends On-Behalf-Of?
https://stackoverflow.com/questions/2782380/best-practices-sending-email-on-behalf-of-users

The best method is to set the `Reply-To` header and play around with the `From Name`.  For example, if we set the `From Name` as `reply-to@your-client.com (original/client's from email) <-`, then Outlook 365 would look like so `reply-to@your-client.com <- <mail-service@your-sending-domain.com>`

Then when user hit reply, it will go to/autofill with `reply-to@your-client.com`; which, if you look at from field, it look exactly like how it work `reply-to@your-client.com <- <mail-service@your-sending-domain.com>`

## To run/debug locally
```sh
docker-compose up
```

Then to test locally, simply open a new terminal and exec:
```sh
# swaks can be install with homebrew on your macos
swaks -f test@github.com -t resque@github.com --server localhost
```

<!-- leave these buried at the bottom of the document -->
[ci-img]: https://github.com/haraka/haraka-plugin-resque/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/haraka/haraka-plugin-resque/actions/workflows/ci.yml
[clim-img]: https://codeclimate.com/github/haraka/haraka-plugin-resque/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-plugin-resque
[npm-img]: https://nodei.co/npm/haraka-plugin-resque.png
[npm-url]: https://www.npmjs.com/package/haraka-plugin-resque
