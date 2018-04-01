#/bin/bash

zip -r "lambda.zip" node_modules index.js ZalixBot.js Messages.js package.json Persister.js
aws lambda update-function-code --function-name zalixbot --zip-file fileb://$(pwd)/lambda.zip