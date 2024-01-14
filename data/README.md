# Docker data folder
This is where all configuration of Haraka are saved for running with docker-compose/docker container.

## Config
This allow you to update and save your haraka/config folder.

## resque
This is the directory that resque use to output full eml file before it get sends to the API


- `myinit.sh` - file is use by docker to initialize the config folder.
- `mystart.sh` - this is use to override default docker startup command to use with the `instrumentisto/haraka` docker image.



