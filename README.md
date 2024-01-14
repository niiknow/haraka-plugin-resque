[![NPM][npm-img]][npm-url]

# haraka-plugin-resque
Haraka plugin that act as a queue and perform REST post to a remote url.


# Ideal Setup
You're a SASS Provider (such as form submission like Wufoo) requiring to send email on-behalf-of client.


## USAGE

SMTP-Client -> Haraka -> API -> Working-SMTP Server - using a different email `sends on-behalf-of/sends-as` your Client.

This plugin pushes your email to a REST API.

```sh
cd /path/to/local/haraka
npm install haraka-plugin-resque

# you should disable the default/dummy smtp_forward plugin
sed -i -e 's,^queue/smtp_forward,#queue/smtp_forward,' config/plugins

# this enable resque, if it's not already in config/plugins folder
grep -qxF 'resque' config/plugins || echo "resque" >> config/plugins

```

Next, copy and edit the default configuration.

```sh
cp node_modules/haraka-plugin-resque/config/resque.json config/resque.json
$EDITOR config/resque.json

# now restart haraka
service haraka restart

```


## And what is this sends on-behalf-of?
The best method is to set the `Reply-To` header and play around with the `From Name`.  For example, if we set the `From Name` as `reply-to@your-client.com (original/client's from email) <-`, then Outlook 365 would look like so `reply-to@your-client.com <- <mail-service@your-sending-domain.com>`

Then when user hit reply, it will go to/autofill with `reply-to@your-client.com`; which, if you look at from field, it look exactly like how it work `reply-to@your-client.com <- <mail-service@your-sending-domain.com>`

Ref: https://stackoverflow.com/questions/2782380/best-practices-sending-email-on-behalf-of-users


## To run/debug locally
```sh
# run locally with
docker-compose up
```

To test locally, simply open a new terminal and exec:
```sh
# swaks can be install with homebrew on your macos
# type: PLAIN,LOGIN,CRAM-MD5
# note: -tls is important here if you want to test with authenticate
# https://github.com/haraka/Haraka/issues/2760#issuecomment-597248728
swaks -f test@github.com -t resque@github.com \
	--server localhost -tls --port 25 --auth LOGIN \
	--auth-user "usertest1" --auth-password "testes123"
```

Now you can view/edit the files in `data/config` and `config/resque` to manipulate your running container configurations.  If you want a completely fresh start/restart, the `cleanup.sh` script be of help.

```sh
# to reset/restart, simply take down the existing docker containers
docker-compose down
# run to cleanup data folder files
./cleanup.sh
# start a new set of containers
docker-compose up
```

NOTE: It is recommended that you enable tls.  See Haraka documentation here: https://haraka.github.io/plugins/tls

Since we allow sending with any `FROM` address, `resque` requires authentication.  Therefore, we must configure `resque.json` with user credentials. We also need the following configurations for Hakara to work:

1. Enable `tls` in `config/plugins` - which is handled inside of `data/mystart.sh`
2. Because we enable tls, we'll need `tls.ini` - which is included in `defaults/config/tls.ini`
3. Set your server `HOSTNAME` inside of docker-compose for using OpenSSL generated self-signed cert.
4. Test it with `-tls` with `swaks` to confirm that `STARTTLS` is working.  If you have SSL issue with certain email client (such as Wordpress SMTP plugin), then you might have to purchase an actual certificate with `tls_cert.pem` and `tls_key.pem` inside of `data/config` folder.

## Planning / Todo
- [x] Json configuration
- [x] Support login credential
- [x] Support API URL switching based on credentials
- [ ] Convert to Typescript and Jest for testing
- [ ] More unit testing cases

<!-- leave these buried at the bottom of the document -->
[ci-img]: https://github.com/haraka/haraka-plugin-resque/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/haraka/haraka-plugin-resque/actions/workflows/ci.yml
[clim-img]: https://codeclimate.com/github/haraka/haraka-plugin-resque/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-plugin-resque
[npm-img]: https://nodei.co/npm/haraka-plugin-resque.png
[npm-url]: https://www.npmjs.com/package/haraka-plugin-resque
