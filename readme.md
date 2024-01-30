script to download files from litespeed web server with bad .htaccess
mihai badea 30.01.2024


1. run index.js with URL argument - website root to be downloaded. no overwrites will be made, if a folder already exists with that name a -1 will be added to the name

linux: URL=http://etc node .
windows: SET URL=http://etc&&node .

note: the URL must end in /